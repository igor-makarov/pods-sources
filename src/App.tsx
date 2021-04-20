import React, { useState } from "react";
import "./styles.css";
import md5 from "blueimp-md5";
import semverSort from "semver-sort";
import md5Hex from "md5-hex";

export default function App() {
  interface MyType {
    versions: string[];
    sources: string[];
  }

  const [state, setState] = useState({versions: [], sources: []} as MyType);

  const onclick = async (e: any) => {
    e.stopPropagation();
    const responseElement = document.getElementById(
      "response"
    ) as HTMLParagraphElement;
    responseElement.textContent = "";
    setState({versions: [], sources: []});

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

    let versions = thisLine.replace(podname + "/", "").split("/");
    try {
      versions = semverSort.desc(versions);
    } catch (error) {
      versions = versions.reverse();
    }
    setState({versions: versions, sources: []})

    // https://cdn.jsdelivr.net/cocoa/Specs/c/0/1/SBTUITestTunnelCommon/6.6.1/SBTUITestTunnelCommon.podspec.json
    const sources = await Promise.all(versions.map(async (v) => {
      const url = `https://cdn.jsdelivr.net/cocoa/Specs/${sha[0]}/${sha[1]}/${sha[2]}/${podname}/${v}/${podname}.podspec.json`;
      const res = await fetch(url);
      const json = await res.json();
      const sourceText = JSON.stringify(json.source);
      document.getElementById(`version-${v}`)!.innerText = sourceText;
      const source = json.source.git || json.source.http;
      if (source != null) {
        document.getElementById(`color-${v}`)!.style.color = "#" + md5Hex(source).slice(0, 6);
      }

      if (json.source.git != null) {
        return json.source.git
      }
      if (json.source.http != null) {
        try {
          const parsedSource = new URL(source);
          return parsedSource.host;
        } catch (error) { }
      }
      return source
    }));

    const distinctSources = [...new Set(sources)].sort();
    setState({versions: versions, sources: distinctSources})

    return false;
  };

  const onkeydown = async (e: any) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      await onclick(e);
    }
  };

  return (
    <div className="App">
      <h1>Check Podspec Sources</h1>
      <input id="main" onKeyDown={onkeydown}/>
      <p id="response">(Case matters)</p>
      <button onClick={onclick}>Check</button>
      {state.sources.length > 0 && <h3>Distinct Sources</h3>}
      <ul>
        {state.sources.map((s) => (
          <li>
            <p className="code">
              <code>{s}</code>
            </p>
          </li>
        ))}
      </ul>
      {state.versions.length > 0 && <h3>Verbose Sources</h3>}
      <ul>
        {state.versions.map((v) => (
          <li key={v}>
            <p className="code">
              <span className="dot" id={`color-${v}`}>⬤ </span>
              <span>{v}</span>
              <br />
              <span id={`version-${v}`}></span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
