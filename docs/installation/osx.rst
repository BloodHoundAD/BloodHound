.. note::
   This documentation applies to Legacy BloodHound and is no longer maintained.

   See up-to-date documentation for BloodHound CE here: `Install BloodHound Community Edition with Docker Compose`_

.. _Install BloodHound Community Edition with Docker Compose: https://support.bloodhoundenterprise.io/hc/en-us/articles/17468450058267

macOS
=====

Install neo4j
^^^^^^^^^^^^^

.. Warning::

  Neo4j 5 suffers from severe performance regression issues. Until further notice, please use Neo4j 4.4.13

1. Download the macOS version of neo4j Community Edition Server from https://neo4j.com/download-center/#community. **Do not install from brew.**

2. Unzip the neo4j folder.

3. In a macOS terminal, change directories to the neo4j folder.

4. Change to the `bin` directory, then type:

::

   $ ./neo4j console

This will start neo4j as a console application. You should eventually see "Remote interface available at http://localhost:7474/"

5. Open a web browser and navigate to http://localhost:7474/. You should see the neo4j web console.

6. Authenticate to neo4j in the web console with username neo4j, password neo4j. You’ll be prompted to change this password.

Download the BloodHound GUI
^^^^^^^^^^^^^^^^^^^^^^^^^^^

1. Download the latest version of the BloodHound GUI from https://github.com/BloodHoundAD/BloodHound/releases

2. Unzip the folder and double click BloodHound

3. Authenticate with the credentials you set up for neo4j

Alternative: Build the BloodHound GUI
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

1. Install NodeJS from https://nodejs.org/en/download/ 

2. Install electron-packager

::

   $ npm install --location=global electron-packager

3. Clone the BloodHound GitHub repo:

::

   $ git clone https://github.com/BloodHoundAD/BloodHound

4. From the root BloodHound directory, run npm install

::

   $ npm install
Build BloodHound with `npm run build:macos`:

::

   $ npm run build:macos
