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
    var goatService: GoatService?
    var mixer = MotorMixer()
    
    @IBOutlet weak var temperatureLabel: UILabel!
    @IBOutlet weak var voltsLabel: UILabel!
    @IBOutlet weak var currentAmpsLabel: UILabel!
    @IBOutlet weak var totalAmpsLabel: UILabel!
    @IBOutlet weak var throttleView: UIView!
    @IBOutlet weak var steeringView: UIView!
    @IBOutlet weak var throttleConstraint: NSLayoutConstraint!
    @IBOutlet weak var steeringConstraint: NSLayoutConstraint!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        throttleView.layer.cornerRadius = 12
        throttleView.layer.masksToBounds = true
        steeringView.layer.cornerRadius = 12
        steeringView.layer.masksToBounds = true
        
        goatDiscovery.startScanning { result in
            switch result {
            case .Success(let service):
                self.goatService = service
                self.mixer.output = { left, right in
                    service.setThrottle(left, motor: .Left)
                    service.setThrottle(right, motor: .Right)
                }
                
                service.systemsMonitorHandler = { status in
                    self.temperatureLabel.text = String.localizedStringWithFormat("%.1f %@", status.temp, "°C")
                    self.voltsLabel.text = String.localizedStringWithFormat("%.1f %@", status.voltage, "V")
                    self.currentAmpsLabel.text = String.localizedStringWithFormat("%.1f %@", status.amps, "A")
                    self.totalAmpsLabel.text = String.localizedStringWithFormat("%.1f %@", status.totalAmps, "Ah")
                }
            case .Failure(let error):
                self.goatService = nil
                self.mixer.output = nil
                print(error)
            }
            
            print("Result: \(result)")
        }
    }

    @IBAction func leftThrottleGesture(sender: UIPanGestureRecognizer) {
        updateSlider(constraint: throttleConstraint, gesture: sender, slider: throttleView, track: throttleView.superview!) { value in
            self.mixer.setThrottle(-value)
        }
    }
    
    @IBAction func steeringGesture(sender: UIPanGestureRecognizer) {
        updateSlider(constraint: steeringConstraint, gesture: sender, slider: steeringView, track: steeringView.superview!) { value in
            self.mixer.setSteering(value)
        }
    }
    
    func updateSlider(constraint constraint: NSLayoutConstraint, gesture: UIPanGestureRecognizer, slider: UIView, track: UIView, callback: ((value: Float) -> Void)) {
        let translation = gesture.locationInView(track)
        let isVertical = track.frame.size.height > track.frame.size.width
        let length = isVertical ? track.frame.size.height : track.frame.size.width
        let maxOffset = length / 2 - (isVertical ? slider.frame.size.height / 2 : slider.frame.size.width / 2)
        let translationFromCenter = (isVertical ? translation.y : translation.x) - length / 2
        let offset = abs(translationFromCenter) > maxOffset ? maxOffset * translationFromCenter.sign() : translationFromCenter
        
        switch(gesture.state) {
        case .Began:
            UIView.animateWithDuration(0.2, delay: 0, options: .CurveEaseOut, animations: {
                constraint.constant = offset
                self.view.layoutIfNeeded()
            }, completion: nil)
        case .Ended:
            UIView.animateWithDuration(0.2, delay: 0, options: .CurveEaseOut, animations: {
                constraint.constant = 0
                self.view.layoutIfNeeded()}) { done in
                    callback(value: 0)
                }
        default:
            constraint.constant = offset
            self.view.layoutIfNeeded()
        }
        
        callback(value: Float(offset / maxOffset))
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
}
