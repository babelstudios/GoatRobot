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

struct LipoVoltage {
    let lipo:Int
    let voltage:Float
}

class GoatService: NSObject, CBPeripheralDelegate {
    
    typealias TemperatureMonitorHandler = ((temperature: Float) -> Void)
    var temperatureMonitorHandler: TemperatureMonitorHandler?

    typealias LipoVoltageMonitorHandler = ((voltages: [LipoVoltage]) -> Void)
    var lipoVoltageMonitorHandler: LipoVoltageMonitorHandler?
    
    let peripheral: CBPeripheral

    static let uuid = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6810")
    let leftMotorUUID = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6811")
    let rightMotorUUID = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6812")
    let temperatureUUID = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6813")
    let lipoVoltageUUID = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6814")
    
    var leftMotor: CBCharacteristic?
    var rightMotor: CBCharacteristic?
    var temperature: CBCharacteristic?
    var lipoVoltage: CBCharacteristic?
    
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
            peripheral.discoverCharacteristics([leftMotorUUID, rightMotorUUID, temperatureUUID, lipoVoltageUUID], forService: service)
        }
    }
    
    func setThrottle(throttle: Int, motor: Motor) {
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
        
        var score = Int16(throttle)
        let data = NSData(bytes: &score, length: sizeof(Int16))
        print("Send throttle: \(throttle), data: \(data)")
        peripheral.writeValue(data, forCharacteristic: motorCharacteristic, type: .WithResponse)
    }
    
    func peripheral(peripheral: CBPeripheral, didDiscoverCharacteristicsForService service: CBService, error: NSError?) {
        for characteristic in service.characteristics! {
            if characteristic.UUID == leftMotorUUID {
                leftMotor = characteristic
            } else if characteristic.UUID == rightMotorUUID {
                rightMotor = characteristic
            } else if characteristic.UUID == temperatureUUID {
                temperature = characteristic
                peripheral.setNotifyValue(true, forCharacteristic: temperature!)
            } else if characteristic.UUID == lipoVoltageUUID {
                lipoVoltage = characteristic
                peripheral.setNotifyValue(true, forCharacteristic: lipoVoltage!)
            }
        }
    }
    
    func peripheral(peripheral: CBPeripheral, didUpdateValueForCharacteristic characteristic: CBCharacteristic, error: NSError?) {
        
        guard let data = characteristic.value else { return }

        if let temperature = temperature where temperature == characteristic {
            guard let handler = temperatureMonitorHandler else { return }
            var temp:Float32 = 0
            data.getBytes(&temp, length: sizeof(Float32))
            handler(temperature: temp)
        } else if let lipoVoltage = lipoVoltage where lipoVoltage == characteristic {
            guard let handler = lipoVoltageMonitorHandler else { return }
            
            let length = data.length
            let count = length / (sizeof(Float32) + sizeof(Int32))
            var result = [LipoVoltage]()
            for index in 1...count {
                let arrayIndex = index - 1
                var lipo:Int32 = 0
                var voltage:Float32 = 0
                data.getBytes(&lipo, range: NSRange.init(location: arrayIndex * (sizeof(Int32) + sizeof(Float32)), length: sizeof(Int32)))
                data.getBytes(&voltage, range: NSRange.init(location: arrayIndex * (sizeof(Int32) + sizeof(Float32)) + sizeof(Int32), length: sizeof(Int32)))
                let lipoVoltage = LipoVoltage(lipo: Int(lipo), voltage: voltage)
                result.append(lipoVoltage)
            }
            handler(voltages: result)
        }
    }
}