import React, { useState } from "react";
import "./styles.css";
import md5 from "blueimp-md5";
import semverSort from "semver-sort";
import md5Hex from "md5-hex";

export default function App() {
  const [versions, setVersions] = useState([] as string[]);

  const onclick = async (e: any) => {
    e.stopPropagation();
    const responseElement = document.getElementById(
      "response"
    ) as HTMLParagraphElement;
    responseElement.textContent = "";
    setVersions([]);

    const v = document.getElementById("main") as HTMLInputElement;
    const podname = v.value.trim();
    const sha = md5(podname);
    const versionsURL = `https://cdn.cocoapods.org/all_pods_versions_${sha[0]}_${sha[1]}_${sha[2]}.txt`;

    const res = await fetch(versionsURL);
    if (!res.ok) {
      return (responseElement.textContent =
        "Could not find Pod, typo or capitalization wrong?");
    }
    const txt = await res.text();
    const thisLine = txt.split("\n").find((t) => t.startsWith(podname));
    if (!thisLine) {
      return (responseElement.textContent =
        "Could not find Pod versions, typo or capitalization wrong?");
    }

    const versions = thisLine.replace(podname + "/", "").split("/");
    try {
      setVersions(semverSort.desc(versions));
    } catch (error) {
      setVersions(versions.reverse());
    }

    // https://cdn.jsdelivr.net/cocoa/Specs/c/0/1/SBTUITestTunnelCommon/6.6.1/SBTUITestTunnelCommon.podspec.json
    versions.map(async (v) => {
      const url = `https://cdn.jsdelivr.net/cocoa/Specs/${sha[0]}/${sha[1]}/${sha[2]}/${podname}/${v}/${podname}.podspec.json`;
      const res = await fetch(url);
      const json = await res.json();
      const sourceText = JSON.stringify(json.source);
      document.getElementById(`version-${v}`)!.innerText = sourceText;
      const source = json.source.git || "12313";
      document.getElementById(`color-${v}`)!.style.backgroundColor =
        "#" + md5Hex(source).slice(0, 6);
    });

    return false;
  };

  return (
    <div className="App">
      <h1>Check Podspec Sources</h1>
      <input id="main" />
      <p id="response">(Case matters)</p>
      <br />
      <button onClick={onclick}>Check</button>
      <ul>
        {versions.map((v) => (
          <li key={v}>
            <p>
              <div className="dot" id={`color-${v}`} />
              {v}
              <code id={`version-${v}`}></code>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
