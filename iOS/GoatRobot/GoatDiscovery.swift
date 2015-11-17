//
//  GoatDiscovery.swift
//  GoatRobot
//
//  Created by Jens Utbult on 2015-11-11.
//  Copyright © 2015 Jens Utbult. All rights reserved.
//

import Foundation
import CoreBluetooth

enum DiscoveryResult {
    case Success(GoatService)
    case Failure(ErrorType)
    
    init(service: GoatService) {
        self = .Success(service)
    }
    init(error: ErrorType) {
        self = .Failure(error)
    }
}

public enum Error : ErrorType {
    case GoatRobotDidDisconnect
}

class GoatDiscovery: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    
    typealias ScanCompletionHandler = ((result: DiscoveryResult) -> Void)
    
    var goatPeripheral: CBPeripheral?
    var completion: ScanCompletionHandler?
    
    lazy var manager: CBCentralManager = {
        [unowned self] in
        return CBCentralManager(delegate: self, queue: nil, options: nil)
    }()
    
    func startScanning(completion: ScanCompletionHandler) {
        self.completion = completion
        startScanning()
    }
    
    private func startScanning() {
        manager.scanForPeripheralsWithServices([GoatService.uuid], options: nil)
    }
    
    func centralManagerDidUpdateState(central: CBCentralManager) {
        startScanning()
        print("centralManagerDidUpdateState: \(central.state.rawValue)")
    }
    
    func centralManager(central: CBCentralManager, didDiscoverPeripheral peripheral: CBPeripheral, advertisementData: [String : AnyObject], RSSI: NSNumber) {
        goatPeripheral = peripheral
        if peripheral.state != .Connected {
            print("Try connecting")
            central.connectPeripheral(peripheral, options: nil)
        }
    }
    
    func centralManager(central: CBCentralManager, didConnectPeripheral peripheral: CBPeripheral) {
        let goatService = GoatService(peripheral: peripheral)
        if let completion = completion {
            completion(result: DiscoveryResult(service: goatService))
        }
    }
    
    func centralManager(central: CBCentralManager, didFailToConnectPeripheral peripheral: CBPeripheral, error: NSError?) {
        guard let error = error else {return}
        guard let completion = completion else {return}
        completion(result: DiscoveryResult(error: error))
    }
    
    func centralManager(central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: NSError?) {
        startScanning()
        guard let completion = completion else {return}

        completion(result: DiscoveryResult(error: Error.GoatRobotDidDisconnect))
    }
}