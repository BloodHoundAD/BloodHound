from setuptools import setup

setup(name='bloodhound',
      version='0.5.0',
      description='Python based ingestor for BloodHound',
      author='Dirk-jan Mollema, Edwin van Vliet, Matthijs Gielen',
      author_email='dirkjan.mollema@fox-it.com, edwin.vanvliet@fox-it.com, matthijs.gielen@fox-it.com',
      maintainer='Dirk-jan Mollema',
      maintainer_email='dirkjan.mollema@fox-it.com',
      url='https://github.com/fox-it/bloodhound.py',
      packages=['bloodhound',
                'bloodhound.ad',
                'bloodhound.enumeration'],
      license='MIT',
      install_requires=['dnspython', 'impacket>=0.9.17', 'ldap3>=2.5.0', 'pyasn1>=0.4'],
      classifiers=[
        'Intended Audience :: Information Technology',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7'
      ],
      entry_points= {
        'console_scripts': ['bloodhound-python=bloodhound:main']
      }
      )
