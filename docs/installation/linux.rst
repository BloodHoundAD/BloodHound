Linux
=====

Install Java
^^^^^^^^^^^^

1. Update your apt sources with this command:

::

  echo "deb http://httpredir.debian.org/debian stretch-backports main" | sudo tee -a /etc/apt/sources.list.d/stretch-backports.list

2. Run apt-get update:

::

  sudo apt-get update

neo4j will now automatically pull from that repo when it needs to install Java as part of its
install process

Install neo4j
^^^^^^^^^^^^^

1. Add the neo4j repo to your apt sources:

::

  wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
  echo 'deb https://debian.neo4j.com stable 4.0' > /etc/apt/sources.list.d/neo4j.list
  sudo apt-get update

2. Install apt-transport-https with apt

::

  apt-get install apt-transport-https

2. Install neo4j community edition using apt:

::

  sudo apt-get install neo4j

3. Stop neo4j

::

  systemctl stop neo4j

4. Start neo4j as a console application and verify it starts up without errors:

::

  cd /usr/bin
  ./neo4j console

.. note:: It is very common for people to host neo4j on a Linux system, but use the BloodHound
   GUI on a different system. neo4j by default only allows local connections. To allow remote
   connections, open the neo4j configuration file (vim /etc/neo4j/neo4j.conf) and edit this line:

   #dbms.default_listen_address=0.0.0.0

   Remove the # character to uncomment the line. Save the file, then start neo4j up again

5. Start neo4j up again. You have two options:

Run neo4j as a console application:

::

  cd /usr/bin
  ./neo4j console

Or use systemctl to start neo4j:

::

  systemctl start neo4j

6. Open a web browser and navigate to https://localhost:7474/. You should see the neo4j web console.

7. Authenticate to neo4j in the web console with username neo4j, password neo4j. You’ll be prompted
   to change this password.

Download the BloodHound GUI
^^^^^^^^^^^^^^^^^^^^^^^^^^^

1. Download the latest version of the BloodHound GUI from https://github.com/BloodHoundAD/BloodHound/releases

2. Unzip the folder, then run BloodHound with the --no-sandbox flag:

::

  ./BloodHound.bin --no-sandbox

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

5. Build BloodHound with 'npm run linuxbuild':

::

  npm run linuxbuild
