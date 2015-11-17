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

class GoatService: NSObject, CBPeripheralDelegate {
    
    let peripheral: CBPeripheral

    static let uuid = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6810")
    let leftMotorUUID = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6811")
    let rightMotorUUID = CBUUID.init(string: "31491EEC-D9BB-41BD-8D63-2282ABAE6812")
    var leftMotor: CBCharacteristic?
    var rightMotor: CBCharacteristic?
    
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
            peripheral.discoverCharacteristics([leftMotorUUID, rightMotorUUID], forService: service)
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
            }
        }
    }
}