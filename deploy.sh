#!/usr/bin/env bash
# DO NOT RUN THIS SCRIPT, THIS IS A SCRIPT FOR TRAVIS TO DO STUFF
response="$(curl -s --user "${GH_USER}" https://api.github.com/repos/BloodHoundAD/BloodHound/releases/4033842/assets)"

iad32id="$(echo "$response" | grep -B 2 \"BloodHound-linux-arm64 | head -n1 | cut -d ":" -f 2 | cut -c 2- | sed 's/.$//')"
x64id="$(echo "$response" | grep -B 2 \"BloodHound-linux-x64 | head -n1 | cut -d ":" -f 2 | cut -c 2- | sed 's/.$//')"
armv7lid="$(echo "$response" | grep -B 2 \"BloodHound-linux-armv7l | head -n1 | cut -d ":" -f 2 | cut -c 2- | sed 's/.$//')"
macid="$(echo "$response" | grep -B 2 \"BloodHound-darwin-x64 | head -n1 | cut -d ":" -f 2 | cut -c 2- | sed 's/.$//')"

if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
	if [[ ! $iad32id == "" ]]; then
		curl -s -X DELETE --user "${GH_USER}" https://api.github.com/repos/BloodHoundAD/BloodHound/releases/assets/$iad32id
	fi

	if [[ ! $x64id == "" ]]; then
		curl -s -X DELETE --user "${GH_USER}" https://api.github.com/repos/BloodHoundAD/BloodHound/releases/assets/$x64id
	fi

	if [[ ! $armv7lid == "" ]]; then
		curl -s -X DELETE --user "${GH_USER}" https://api.github.com/repos/BloodHoundAD/BloodHound/releases/assets/$armv7lid
	fi

	 curl -X POST -# --header 'Content-Type:application/zip' --data-binary @BloodHound-linux-arm64-$TRAVIS_COMMIT.zip --user "${GH_USER}" https://uploads.github.com/repos/BloodHoundAD/BloodHound/releases/4033842/assets?name=BloodHound-linux-arm64-$TRAVIS_COMMIT.zip
	 curl -X POST -# --header 'Content-Type:application/zip' --data-binary @BloodHound-linux-x64-$TRAVIS_COMMIT.zip --user "${GH_USER}" https://uploads.github.com/repos/BloodHoundAD/BloodHound/releases/4033842/assets?name=BloodHound-linux-x64-$TRAVIS_COMMIT.zip
	 curl -X POST -# --header 'Content-Type:application/zip' --data-binary @BloodHound-linux-armv7l-$TRAVIS_COMMIT.zip --user "${GH_USER}" https://uploads.github.com/repos/BloodHoundAD/BloodHound/releases/4033842/assets?name=BloodHound-linux-armv7l-$TRAVIS_COMMIT.zip
fi

if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
	if [[ ! $macid == "" ]]; then
		curl -s -X DELETE --user "${GH_USER}" https://api.github.com/repos/BloodHoundAD/BloodHound/releases/assets/$macid
	fi

	curl -X POST -# --header 'Content-Type:application/zip' --data-binary @BloodHound-darwin-x64-$TRAVIS_COMMIT.zip --user "${GH_USER}" https://uploads.github.com/repos/BloodHoundAD/BloodHound/releases/4033842/assets?name=BloodHound-darwin-x64-$TRAVIS_COMMIT.zip
fi
