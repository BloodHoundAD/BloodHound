.. note::
   This documentation applies to Legacy BloodHound and is no longer maintained.

   See up-to-date documentation for BloodHound CE here: `Install BloodHound Community Edition with Docker Compose`_

.. _Install BloodHound Community Edition with Docker Compose: https://support.bloodhoundenterprise.io/hc/en-us/articles/17468450058267

Linux
=====

Install Java
^^^^^^^^^^^^

1. Install Open JDK 11:

::

  sudo apt-get install openjdk-11-jdk


Install neo4j
^^^^^^^^^^^^^

.. Warning::

  Neo4j 5 suffers from severe performance regression issues. Until further notice, please use latest Neo4j 4.x version

1. Add the neo4j repo to your apt sources:

::

  wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
  echo 'deb https://debian.neo4j.com stable 4' | sudo tee /etc/apt/sources.list.d/neo4j.list > /dev/null
  sudo apt-get update

2. Install apt-transport-https with apt

::

  sudo apt-get install apt-transport-https

.. note:: In Ubuntu server installations, you also need to make sure that the universe repository is enabled. If the universe repository is not present, the Neo4j installation will fail with the error Depends: daemon but it is not installable.
   This can be fixed by running the command:

   sudo add-apt-repository universe


3. Install neo4j community edition using apt:

::

  sudo apt-get install neo4j

4. Stop neo4j

::

  sudo systemctl stop neo4j

5. Start neo4j as a console application and verify it starts up without errors:

::

  cd /usr/bin
  sudo ./neo4j console

.. note:: It is very common for people to host neo4j on a Linux system, but use the BloodHound
   GUI on a different system. neo4j by default only allows local connections. To allow remote
   connections, open the neo4j configuration file (vim /etc/neo4j/neo4j.conf) and edit this line:

   #dbms.default_listen_address=0.0.0.0

   Remove the # character to uncomment the line. Save the file, then start neo4j up again

6. Start neo4j up again. You have two options:

Run neo4j as a console application:

::

  cd /usr/bin
  ./neo4j console

Or use systemctl to start neo4j:

::

  sudo systemctl start neo4j

7. Open a web browser and navigate to https://localhost:7474/. You should see the neo4j web console.

8. Authenticate to neo4j in the web console with username neo4j, password neo4j. You’ll be prompted
   to change this password.

Download the BloodHound GUI
^^^^^^^^^^^^^^^^^^^^^^^^^^^

1. Download the latest version of the BloodHound GUI from https://github.com/BloodHoundAD/BloodHound/releases

2. Unzip the folder, then run BloodHound with the --no-sandbox flag:

::

  ./BloodHound --no-sandbox

3. Authenticate with the credentials you set up for neo4j

Alternative: Build the BloodHound GUI
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

1. Install NodeJS from https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

2. Install electron-packager:

::

  sudo npm install -g electron-packager

3. Clone the BloodHound GitHub repo:

::

  git clone https://github.com/BloodHoundAD/Bloodhound

4. From the root BloodHound directory, run 'npm install'

::

  npm install

5. Build BloodHound with 'npm run build:linux':

::

  npm run build:linux
