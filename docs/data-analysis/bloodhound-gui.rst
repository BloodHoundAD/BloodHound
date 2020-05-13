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

GUI Elements
^^^^^^^^^^^^

Upon successful logon, BloodHound will draw any group(s) with the
"Domain Admins" in their name, and show you the effective users that
belong to the group(s):

.. image:: /images/bloodhound-initial-query.png   
   :align: center
   :width: 900px
   :alt: BloodHound displaying the members of the Domain Admins group

Graph Drawing Area
------------------

As much of the screen real estate as possible is dedicated to the graph
rendering area - where BloodHound displays nodes and the relationships
between them. You can move nodes around, highlight paths by mousing over
a node involved in a path, and click on nodes to see more information
about those nodes. You can also right click nodes and perform several
actions against those nodes:

.. image:: /images/right-click-group-node.png   
   :align: center
   :width: 900px
   :alt: Right click menu on a group node

* **Set as Starting Node:** Set this node as the starting point in the
  pathfinding tool. Click this and you will see this node's name in the
  search bar, then you can select another node to target after clicking
  the pathfinding button.
* **Set as Ending Node:** Set this node as the target node in the pathfinding
  tool.
* **Shortest Paths to Here:** This will perform a query to find all shortest
  paths from any arbitrary node in the database to this node. This may cause
  a very long query time in neo4j and an even longer render time in the
  BloodHound GUI.
* **Shortest Paths to Here from Owned:** Find attack paths to this node from
  any node you have marked as owned.
* **Edit Node:** This brings up the node editing modal, where you can edit
  current properties on the node or even add your own custom properties to
  the node.
* **Mark Group as Owned:** This will internally set the node as owned in the
  neo4j database, which you can then use in conjunction with other queries
  such as "Shortest paths to here from Owned"
* **Mark/Unmark Group as High Value:** Some nodes are marked as "high value"
  by default, such as the domain admins group and enterprise admin group.
  This can then be used with other queries such as "shortest paths to high
  value assets"
* **Delete Node:** Deletes the node from the neo4j database

You can also right click edges, then click "help" to see information about
any particular attack primitive:

.. image:: /images/right-click-edge-help.gif  
   :align: center
   :width: 900px
   :alt: Right click edge and get help

Search Bar
----------

Raw Query Bar
-------------

Upper Right Menu
----------------
