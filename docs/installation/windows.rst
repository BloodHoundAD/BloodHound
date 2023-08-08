.. note::
   This documentation applies to Legacy BloodHound and is no longer maintained.

   See up-to-date documentation for BloodHound CE here: `Install BloodHound Community Edition with Docker Compose`_

.. _Install BloodHound Community Edition with Docker Compose: https://support.bloodhoundenterprise.io/hc/en-us/articles/17468450058267

Windows
=======

Walkthrough Video
^^^^^^^^^^^^^^^^^

.. raw:: html

    <div style="text-align: center; margin-bottom: 2em;">
    <iframe width="100%" height="350" src="https://www.youtube.com/embed/PgjtvxA-MMk" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
    </div>


Install Java
^^^^^^^^^^^^

1. Download the Windows installer for Oracle JDK 11 from https://www.oracle.com/java/technologies/javase-jdk11-downloads.html (needs an Oracle account).  

   Alternatively download and install the Microsoft build of OpenJDK 11 without any registration or login: https://learn.microsoft.com/en-us/java/openjdk/download#openjdk-11

2. Use the according installer to setup JDK. The default options work fine. You want to make sure though that the `JAVA_HOME` System variable is set correctly.
   In the Microsoft setup this is an option during installation:

   .. image:: /images/java_home_variable.png  
      :align: center
      :width: 900px
      :alt: JAVA_HOME variable

   .. note:: You want to make sure that the System variable `JAVA_HOME` is set correctly, pointing to you OpenJDK 11 by running the following command:
   
   ::

      rundll32.exe sysdm.cpl,EditEnvironmentVariables


   .. image:: /images/java_home_check.png  
      :align: center
      :width: 900px
      :alt: JAVA_HOME variable

Install neo4j
^^^^^^^^^^^^^

.. Warning::

  Neo4j 5 suffers from severe performance regression issues. Until further notice, please use the latest Neo4j 4.4.x version

1. Download the latest neo4j 4.x Community Server Edition zip from https://neo4j.com/download-center/#community

2. Unzip the neo4j zip file.

3. Open a command prompt, running as administrator. Change directory to the unzipped neo4j folder.

4. Change directory to the `bin` directory in the Neo4j folder.

5. Run the following command:

::

   C:\> neo4j.bat install-service

.. note:: At this point you may see an error about Java not being found, or the wrong
   version of Java running. Make sure you followed the JAVA installation steps correctly.  

.. note:: You might run into an error `Couldn't find prunsrv file for interacting with the windows service subsystem ...`. This happens if the System variables 
   `NEO4J_CONF` and `NEO4J_HOME` are not set (correctly). Both need to point to the root of the neo4j folder.

.. image:: /images/neo4j_error_1.png 
   :align: center
   :width: 900px
   :alt: JAVA_HOME variable

.. note:: You might run into an error `Could not find or load main class org.neo4j.server.startup.Neo4jCommand`. This happens if the System variables 
   `NEO4J_CONF` and `NEO4J_HOME` are not set (correctly). Both need to point to the root of the neo4j folder.

.. image:: /images/neo4j_error_2.png 
   :align: center
   :width: 900px
   :alt: JAVA_HOME variable

.. image:: /images/neo4j_paths.png  
      :align: center
      :width: 900px
      :alt: neo4j variables

6. neo4j is now installed as a Windows service. Run this command:

::

   C:\> net start neo4j

You should see the message, "The neo4j Graph Database - neo4j service was started successfully."

7. Open a web browser and navigate to http://localhost:7474/. You should see the neo4j web console.

8. Authenticate to neo4j in the web console with username `neo4j`, password `neo4j`. You'll
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

5. Build BloodHound with `npm run build:win32`

::

   C:\> npm run build:win32
