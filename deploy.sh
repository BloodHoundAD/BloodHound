#!/usr/bin/env bash
response="$(curl -s --user "${GH_USER}" https://api.github.com/repos/adaptivethreat/BloodHound/releases/4033842/assets)"

win32id="$(echo "$response" | grep -B 1 \"BloodHound-linux-ia32 | head -n1 | cut -d ":" -f 2 | cut -c 2- | sed 's/.$//')"
x64id="$(echo "$response" | grep -B 1 \"BloodHound-linux-x64 | head -n1 | cut -d ":" -f 2 | cut -c 2- | sed 's/.$//')"
macid="$(echo "$response" | grep -B 1 \"BloodHound-darwin-x64 | head -n1 | cut -d ":" -f 2 | cut -c 2- | sed 's/.$//')"

echo $response

if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
	if [[ ! $win32id == "" ]]; then
		curl -s -X DELETE --user "${GH_USER}" https://api.github.com/repos/adaptivethreat/BloodHound/releases/assets/$win32id
	fi

	if [[ ! $x64id == "" ]]; then
		curl -s -X DELETE --user "${GH_USER}" https://api.github.com/repos/adaptivethreat/BloodHound/releases/assets/$win32id
	fi

	 curl -X POST -# --header 'Content-Type:application/zip' --data-binary @BloodHound-linux-ia32.zip --user "${GH_USER}" https://uploads.github.com/repos/adaptivethreat/BloodHound/releases/4033842/assets?name=BloodHound-linux-ia32.zip
	 curl -X POST -# --header 'Content-Type:application/zip' --data-binary @BloodHound-linux-x64.zip --user "${GH_USER}" https://uploads.github.com/repos/adaptivethreat/BloodHound/releases/4033842/assets?name=BloodHound-linux-x64.zip
fi

if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
	if [[ ! $macid == "" ]]; then
		curl -s -X DELETE --user "${GH_USER}" https://api.github.com/repos/adaptivethreat/BloodHound/releases/assets/$win32id
	fi

	curl -X POST -# --header 'Content-Type:application/zip' --data-binary @BloodHound-darwin-x64.zip --user "${GH_USER}" https://uploads.github.com/repos/adaptivethreat/BloodHound/releases/4033842/assets?name=BloodHound-darwin-x64.zip
fi
