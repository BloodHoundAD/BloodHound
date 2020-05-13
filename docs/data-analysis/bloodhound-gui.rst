The BloodHound GUI
==================

The BloodHound GUI is where the vast majority of your data
analysis will happen. Our primary objectives in desining the
BloodHound GUI are intuitive design and operational focus. In
other words, we want you to get access to the data you need
as easily and quickly as possible.

Authentication
^^^^^^^^^^^^^^

When you open the BloodHound GUI for the first time, you will
see an authentication prompt:

.. image:: /images/bloodhound-logon.png   
   :align: center
   :width: 900px
   :alt: BloodHound logon screen

.. note:: Want to follow along? Connect to the example database
  hosted at bolt://206.189.85.93:7687

The "Database URL" is the IP address and port where your neo4j
database is running, and should be formatted as bolt://ip:7687/

The DB Username is the username for the neo4j database.
The default username for a neo4j database is neo4j.

The DB Password is the password for the neo4j database. The
default password for a neo4j database is neo4j. The password
for the example database is BloodHound.

Click "Login", and the GUI will attempt to authenticate to neo4j
with the information you provided.

You can optionally click "Save Password" to automatically log in
next time with the same info.

GUI Elements
^^^^^^^^^^^^

After successful authentication, the BloodHound GUI will do three
things:

1. First, the GUI will perform a cypher query to ensure the graph
   schema has the appropriate indices and constraints. These operations
   prevent duplicate node creation and greatly speed up node lookup
2. Second, the GUI will collect stats about the database and display
   those stats in the "Database Info" tab.
3. Finally, the GUI will query for all users that belong to any Domain
   Admins group, then display those users and show how they belong to
   the Domain Admins group.
  
.. image:: /images/bloodhound-initial-query.png   
   :align: center
   :width: 900px
   :alt: BloodHound displaying the members of the Domain Admins group
