Windows
=======

Install Java
^^^^^^^^^^^^

1. Download the Windows installer for Oracle JDK 11 from https://www.oracle.com/java/technologies/javase-jdk11-downloads.html

2. Use the installer to install Oracle JDK. The default options work fine.


Install neo4j
^^^^^^^^^^^^^

1. Download the neo4j Community Server Edition zip from https://neo4j.com/download-center/#community

2. Unzip the neo4j zip file.

3. Open a command prompt, running as administrator. Change directory to the unzipped neo4j folder.

4. Change directory to the `bin` directory in the Neo4j folder.

5. Run the following command:

::

   C:\> neo4j.bat install-service

.. note:: At this point you may see an error about Java not being found, or the wrong
   version of Java running. Ensure your JAVA_HOME environment variable is set to the
   JDK folder (example: C:\\Program Files\\Java\\jdk-11.0.6

6. neo4j is now installed as a Windows service. Run this command:

::

   C:\> net start neo4j

You should see the message, "The neo4j Graph Database - neo4j service was started successfully."

7. Open a web browser and navigate to http://localhost:7474/. You should see the neo4j web console.

8. Authenticate to neo4j in the web console with username neo4j, password neo4j. You'll
   be prompted to change this password.

Download the BloodHound GUI
^^^^^^^^^^^^^^^^^^^^^^^^^^^

1. Download the latest version of the BloodHound GUI from https://github.com/BloodHoundAD/BloodHound/releases

2. Unzip the folder and double click BloodHound.exe

3. Authenticate with the credentials you set up for neo4j

Alternative: Build the BloodHound GUI
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

1. Install NodeJS from https://nodejs.org/en/download/

2. Install electron-packager

::

   C:\> npm install -g electron-packager

3. Clone the BloodHound GitHub repo:

::

   C:\> git clone https://github.com/BloodHoundAD/BloodHound

4. From the root BloodHound directory, run `npm install`

::

   C:\> npm install

5. Build BloodHound with `npm run winbuild`

::

   C:\> npm run winbuild
