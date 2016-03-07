//
//  GoatService.swift
//  GoatRobot
//
//  Created by Jens Utbult on 2015-11-11.
//  Copyright © 2015 Jens Utbult. All rights reserved.
//

import Foundation
import CoreBluetooth

enum Motor {
    case Left
    case Right
}

struct SystemStatus {
    let voltage: Float
    let amps: Float
    let totalAmps: Float
    let temp: Float
}

class GoatService: NSObject, CBPeripheralDelegate {
    
    typealias TemperatureMonitorHandler = ((temperature: Float) -> Void)

    typealias SystemsMonitorHandler = ((status: SystemStatus) -> Void)
    var systemsMonitorHandler: SystemsMonitorHandler?
    
    let peripheral: CBPeripheral

    static let uuid = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6810")
    let leftMotorUUID = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6811")
    let rightMotorUUID = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6812")
    let systemsMonitorUUID = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6813")
    
    var leftMotor: CBCharacteristic?
    var rightMotor: CBCharacteristic?
    var system: CBCharacteristic?
    
    var leftMotorTS = NSDate().timeIntervalSince1970
    var rightMotorTS = NSDate().timeIntervalSince1970
    
    init(peripheral: CBPeripheral) {
        self.peripheral = peripheral
        super.init()
        peripheral.delegate = self
        peripheral.discoverServices([GoatService.uuid])
    }
    
    func peripheral(peripheral: CBPeripheral, didDiscoverServices error: NSError?) {
        for service in peripheral.services! {
            peripheral.discoverCharacteristics([leftMotorUUID, rightMotorUUID, systemsMonitorUUID], forService: service)
        }
    }
    
    func setThrottle(throttle: Float, motor: Motor) {
        print("\(throttle)")
        guard let leftMotor = leftMotor else { return }
        guard let rightMotor = rightMotor else { return }
        
        let currentTime = NSDate().timeIntervalSince1970
        var motorCharacteristic: CBCharacteristic
        switch(motor) {
        case(.Left):
            if currentTime - leftMotorTS < 0.2 { return }
            leftMotorTS = currentTime
            motorCharacteristic = leftMotor
        case(.Right):
            if currentTime - rightMotorTS < 0.2 { return }
            rightMotorTS = currentTime
            motorCharacteristic = rightMotor
        }
        
        var scaledThrottle = Int16(throttle * 100)
        let data = NSData(bytes: &scaledThrottle, length: sizeof(Int16))
        print("Send throttle: \(throttle), data: \(data)")
        peripheral.writeValue(data, forCharacteristic: motorCharacteristic, type: .WithResponse)
    }
    
    func peripheral(peripheral: CBPeripheral, didDiscoverCharacteristicsForService service: CBService, error: NSError?) {
        for characteristic in service.characteristics! {
            print("discovered characteristic: \(characteristic.UUID)")
            
            if characteristic.UUID == leftMotorUUID {
                leftMotor = characteristic
            } else if characteristic.UUID == rightMotorUUID {
                rightMotor = characteristic
            } else if characteristic.UUID == systemsMonitorUUID {
                system = characteristic
                peripheral.setNotifyValue(true, forCharacteristic: system!)
            }
        }
    }
    
    func peripheral(peripheral: CBPeripheral, didUpdateValueForCharacteristic characteristic: CBCharacteristic, error: NSError?) {
        
        guard let data = characteristic.value else { return }

        print("\(data)")
        if let system = system where system == characteristic {
            guard let handler = systemsMonitorHandler else { return }
            var result = [Float32]()
            for index in 1...4 {
                var value:Float32 = 0
                print("index: \(index - 1)")
                data.getBytes(&value, range: NSRange.init(location: (index - 1) * sizeof(Float32), length: sizeof(Float32)))
                result.append(value)
            }
            let status = SystemStatus(voltage: result[0], amps: result[1], totalAmps: result[2], temp: result[3])
            handler(status: status)
        }
    }
}