# Homepage navigation and discovery

User request: reference atoms.dev, add a sidebar and make the first page less empty.

Reference inspected: https://atoms.dev/ and https://atoms.dev/discover on 2026-10-10. The available signed-out pages showed top navigation, application examples, agent descriptions and help. An authenticated original sidebar was not available; our sidebar is adapted to the existing Atoms Lite capabilities, not claimed as an exact reproduction.

Implemented:
- Shared desktop sidebar / mobile drawer on Home, Projects and Discover.
- New project, Home, My projects, Discover, AI team, help and repository links.
- Five recent owned projects with explicit logged-out, empty and failure states.
- Three actually published applications, version-matched covers and working Open / Remix links.
- Existing four agents and brief help disclosures. Existing homepage art and composer retained.

Validation: desktop 1280px and phone 375px browser inspection; mobile navigation opens and closes on selection; Home / Discover / team anchor / help disclosure / My projects login redirect checked. No horizontal overflow. No app-generation requests were needed.
