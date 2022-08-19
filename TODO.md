# teahouse todo

in no particular order...

- [/] network robustitude
    - [x] fix network mocks for tests
    - [ ] failure handling for relays: bad payloads, disconnects, incompatible nipsets
- [/] cache for profiles + messages
    - [ ] localstorage instead of idb? (simpler, maps directly to files + other k/v backends)
    - [ ] add edit log, push that for sync
- [/] local filter matching
    - [ ] batch filtering
    - [ ] views/projections
- [ ] deno relay
    - [ ] dev + build tooling
    - [ ] library is "vanilla" esm
    - [ ] relay "workbench" (build-a-relay w/extensions and config in code)
- [ ] metrics endpoint
    - [ ] internal/service
    - [ ] client-submitted
