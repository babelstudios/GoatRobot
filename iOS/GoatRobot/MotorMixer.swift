//
//  MotorMixer.swift
//  GoatRobot
//
//  Created by Jens Utbult on 2016-03-06.
//  Copyright © 2016 Jens Utbult. All rights reserved.
//

import Foundation

struct MotorMixer {
    
    var output: ((left: Float, right: Float) -> Void)?
    var steering: Float = 0
    var throttle: Float = 0
    
    mutating func setSteering(steering: Float) {
        self.steering = steering
        generateOutput()
    }
    
    mutating func setThrottle(throttle: Float) {
        self.throttle = throttle
        generateOutput()
    }
    
    private func generateOutput() {
        print("Mix throttle: \(throttle) + steering: \(steering)")
        guard let output = output else { return }
        let absThrottle = abs(throttle)
        if absThrottle > 0 {
            var left = throttle + steering / 2
            var right = throttle - steering / 2
            if left < 0 {
                right -= left
                left = 0.1
            }
            if right < 0 {
                left -= right
                right = 0.1
            }
            if left > 1 {
                right -= left - 1
                left = 1
            }
            if right > 1 {
                left -= right - 1
                right = 1
            }
            output(left: left * throttle.sign(), right: right * throttle.sign())
        } else {
            output(left: steering, right: -steering)
        }
    }
}