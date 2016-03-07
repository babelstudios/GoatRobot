//
//  Math.swift
//  GoatRobot
//
//  Created by Jens Utbult on 2016-03-07.
//  Copyright © 2016 Jens Utbult. All rights reserved.
//

import Foundation

extension SignedNumberType {
    func sign<T: SignedNumberType> () -> T {
        if self < 0 {
            return -1
        }
        if self > 0 {
            return 1
        }
        return 0
    }
}

extension Comparable {
    func clamp<T: Comparable>(lower: T, _ upper: T) -> T {
        return min(max(self as! T, lower), upper)
    }
}
