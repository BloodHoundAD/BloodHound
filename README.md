# Getting Started with BloodHound

To get started with BloodHound, check out the [BloodHound docs.](https://bloodhound.readthedocs.io/en/latest/index.html)

# About BloodHound

BloodHound is a single page Javascript web application, built on top of [Linkurious](http://linkurio.us/), compiled with [Electron](http://electron.atom.io/), with a [Neo4j](https://neo4j.com/) database fed by a C# data collector.

BloodHound uses graph theory to reveal the hidden and often unintended relationships within an Active Directory or Azure environment. Attackers can use BloodHound to easily identify highly complex attack paths that would otherwise be impossible to quickly identify. Defenders can use BloodHound to identify and eliminate those same attack paths. Both blue and red teams can use BloodHound to easily gain a deeper understanding of privilege relationships in an Active Directory or Azure environment.

BloodHound was created by [@_wald0](https://www.twitter.com/_wald0), [@CptJesus](https://twitter.com/CptJesus), and [@harmj0y](https://twitter.com/harmj0y).

BloodHound is maintained by the [BloodHound Enterprise](https://bloodhoundenterprise.io/) team.

# About BloodHound Enterprise

[BloodHound Enterprise](https://bloodhoundenterprise.io/) is an Attack Path Management solution that continuously maps and quantifies Active Directory Attack Paths. You can remove millions, even billions of Attack Paths within your existing architecture and eliminate the attacker’s easiest, most reliable, and most attractive techniques.

# Downloading BloodHound Binaries
Pre-Compiled BloodHound binaries can be found [here](https://github.com/BloodHoundAD/BloodHound/releases). 

The rolling release will always be updated to the most recent source. Tagged releases are considered "stable" but will likely not have new features or fixes.

# Creating example data

A sample database generator can be found [here](https://github.com/BloodHoundAD/BloodHound-Tools/tree/master/DBCreator)

You can create your own example Active Directory environment using [BadBlood](https://github.com/davidprowe/BadBlood).

# License

BloodHound uses graph theory to reveal hidden relationships and
attack paths in an Active Directory environment.
Copyright (C) 2016-2019 Andrew Robbins, Rohan Vazarkar, Will Schroeder

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
