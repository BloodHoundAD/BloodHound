.. note::
   This documentation applies to Legacy BloodHound and is no longer maintained.

   See up-to-date documentation for BloodHound CE here: `BloodHound Support`_

.. _BloodHound Support: https://support.bloodhoundenterprise.io/hc/en-us

BloodHound: Six Degrees of Domain Admin
=======================================

.. meta::
   description lang=en: Identify and execute attack paths in Active Directory

.. image:: /images/bloodhound-logo.png   
   :align: center
   :width: 300px
   :alt: BloodHound logo

BloodHound uses graph theory to reveal the hidden and often unintended
relationships within an Active Directory environment. As of version 4.0, BloodHound
now also supports Azure. Attackers can use
BloodHound to easily identify highly complex attack paths that would otherwise
be impossible to quickly identify. Defenders can use BloodHound to identify
and eliminate those same attack paths. Both blue and red teams can use
BloodHound to easily gain a deeper understanding of privilege relationships in
an Active Directory environment.

Install
-------   

Depending on which operating system you're using, install Neo4j, then
download the BloodHound GUI. You can also build the BloodHound GUI from source.

OS-specific instructions: 
:doc:`Windows <installation/windows>` |
:doc:`macOS <installation/osx>` |
:doc:`Linux <installation/linux>`

Collect Your First Dataset
--------------------------

BloodHound is a data analysis tool and needs data to be useful. There are two
officially supported data collection tools for BloodHound: SharpHound and
AzureHound. Download AzureHound and/or SharpHound to collect your first data set. From a
domain-joined system in your target Active Directory environnment, collecting
your first dataset is quite simple:

::

   C:\> SharpHound.exe
   
Collecting your first data set with AzureHound:

::

   PS C:\> Import-Module Az
   PS C:\> Import-Module AzureADPreview
   PS C:\> Connect-AzureAD
   PS C:\> Connect-AzAccount
   PS C:\> . .\AzureHound.ps1
   PS C:\> Invoke-AzureHound

Import and Explore the Data
---------------------------

By default, SharpHound and AzureHound will generate several JSON files and place them into one
zip. Drag and drop that zip into the BloodHound GUI, and BloodHound will import
that data.

Once complete, you're ready to explore the data. Search for the Domain Users
group using the search bar in the upper left. See if the Domain Users group has
local admin rights anywhere, or control of any objects in Active Directory.

Click the Pathfinding button (looks like a road) and search for Domain Admins
in the box that drops below. See if there are any attack paths from Domain Users
to Domain Admins.

For a full tour of the BloodHound GUI and its data analysis capabilities, see
the Data Analysis section.

Getting Help
------------

Have a bug report or feature request? Open an issue on the `BloodHound repo`_

Need assistance? Join us in the `BloodHound Gang Slack`_

.. _BloodHound repo: https://www.github.com/BloodHoundAD/BloodHound
.. _BloodHound Gang Slack: https://bloodhoundgang.herokuapp.com

.. toctree::
   :maxdepth: 2
   :hidden:
   :caption: Installation

   installation/windows
   installation/osx
   installation/linux

.. toctree::
   :maxdepth: 2
   :hidden:
   :caption: Data Collection

   data-collection/sharphound
   data-collection/sharphound-all-flags
   data-collection/azurehound
   data-collection/azurehound-all-flags
   data-collection/bloodhound-py

.. toctree::
   :maxdepth: 2
   :hidden:
   :caption: Data Analysis

   data-analysis/bloodhound-gui
   data-analysis/nodes
   data-analysis/edges

.. toctree::
   :maxdepth: 2
   :hidden:
   :caption: Further Reading/Viewing

   further-reading/further-reading.rst
   further-reading/json.rst

.. toctree::
   :maxdepth: 2
   :hidden:
   :caption: Cypher Query Language

   cypher-query-language/intro-to-cypher
   cypher-query-language/cypher-query-gallery

.. toctree::
   :maxdepth: 2
   :hidden:
   :caption: Blue Team Use Cases

   blue-team-use-cases/auditing-permissions
