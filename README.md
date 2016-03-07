# GoatRobot

This might turn into an autonomous lawn mover. At its current incarnation it's a really fancy tracked robot
controlled from an iOS application via bluetooth. The kids will love it but its utility is questionable if you want
to cut your grass.

The robot is written in node.js and runs on a Raspberry Pi. It has a 9 dof sensor to keep track of its heading
and a GPS to figure out where on the lawn it is. There's also some onboard energy monitoring, a temperature sensor and a
nice pulsing RGB led that hopefully will show the status of the robot in the future.

People wanting to do sensor fusion on a Raspberry Pi using node.js might find this project interesting.

![Alt text](images/robot-prototype.jpg?raw=true "Title")
