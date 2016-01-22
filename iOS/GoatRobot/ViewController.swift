//
//  ViewController.swift
//  GoatRobot
//
//  Created by Jens Utbult on 2015-11-11.
//  Copyright © 2015 Jens Utbult. All rights reserved.
//

import UIKit

class ViewController: UIViewController {

    lazy var goatDiscovery: GoatDiscovery = {
        return GoatDiscovery()
    }()
    
    var switcher = true
    
    var goatService: GoatService!
    @IBOutlet weak var temperatureLabel: UILabel!
    @IBOutlet weak var lipoOneLabel: UILabel!
    @IBOutlet weak var lipoTwoLabel: UILabel!
    @IBOutlet weak var leftThrottleView: UIView!
    @IBOutlet weak var rightThrottleView: UIView!
    @IBOutlet weak var leftThrottleVerticalConstraint: NSLayoutConstraint!
    @IBOutlet weak var rightThrottleVerticalConstraint: NSLayoutConstraint!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        leftThrottleView.layer.cornerRadius = 12
        leftThrottleView.layer.masksToBounds = true
        rightThrottleView.layer.cornerRadius = 12
        rightThrottleView.layer.masksToBounds = true
        
        goatDiscovery.startScanning { result in
            switch result {
            case .Success(let service):
                self.goatService = service
                self.goatService.temperatureMonitorHandler = { temperature in
                    self.temperatureLabel.text = String.localizedStringWithFormat("%.1f %@", temperature, "°C")
                }
                self.goatService.lipoVoltageMonitorHandler = { voltages in
                    let voltageOne = voltages[0]
                    self.lipoOneLabel.text = "Lipo #\(voltageOne.lipo): \(String.localizedStringWithFormat("%.1f %@", voltageOne.voltage, "V"))"
                    let voltageTwo = voltages[1]
                    self.lipoTwoLabel.text = "Lipo #\(voltageTwo.lipo): \(String.localizedStringWithFormat("%.1f %@", voltageTwo.voltage, "V"))"
                }
            case .Failure(let error):
                self.goatService = nil
                print(error)
            }
            
            print("Result: \(result)")
        }
    }

    @IBAction func leftThrottleGesture(sender: UIPanGestureRecognizer) {
        updateThrottleWithGesture(sender, motor: .Left)
        updateThrottleConstraint(leftThrottleVerticalConstraint, gesture: sender)
    }

    @IBAction func rightThrottleGesture(sender: UIPanGestureRecognizer) {
        updateThrottleWithGesture(sender, motor: .Right)
        updateThrottleConstraint(rightThrottleVerticalConstraint, gesture: sender)
    }
    
    func updateThrottleWithGesture(gesture: UIPanGestureRecognizer, motor: Motor) {
        let throttle = -(gesture.locationInView(view).y - view.frame.size.height / 2) / (view.frame.size.height / 2)
        //        print("setThrottle: \(Int(throttle * 100)) motor: \(motor)")
        guard let goatService = goatService else { return }
        goatService.setThrottle(Int(throttle * 100), motor: motor)
    }
    
    func updateThrottleConstraint(constraint: NSLayoutConstraint, gesture: UIPanGestureRecognizer) {
        let translation = gesture.locationInView(view)
        switch(gesture.state) {
        case(.Began):
            UIView.animateWithDuration(0.2, delay: 0, options: .CurveEaseOut, animations: {
                constraint.constant = translation.y - self.view.frame.size.height / 2
                self.view.layoutIfNeeded()
                }, completion: nil)
        case(.Ended):
            UIView.animateWithDuration(0.2, delay: 0, options: .CurveEaseOut, animations: {
                constraint.constant = 0
                self.view.layoutIfNeeded()
                }, completion: { done in
                    print("setThrottle: 0")
                    guard let goatService = self.goatService else { return }
                    goatService.setThrottle(0, motor: .Left)
                    goatService.setThrottle(0, motor: .Right)
                    
            })
        default:
            constraint.constant = translation.y - view.frame.size.height / 2
        }
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
}

