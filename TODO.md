**TODOS**

the project need alot of refactor and improvments , i ll put some that come to my mind rn here:


- enable the fetching of active tab content from the currentcontext in the chatdemo component
- add proper logging for debugging purposes
- the whole shit need a refactor anyway 
- add better and safe way messageing betewen the diffrent conexxt (bg , content scritp , sidepanel , and even the backed istelf ) tkae  look at wxt message passing docs , maybe take look aslo at `chrome trpc`
- use shared types and shemeas 
- make the tools defintions that get injected the the stream object, infrend automalycly from the implmnetations , not hardcoded in `tools.ts`
- add a service layer to wrap the browser sevices (tabservice, pageservices etc ) and wrap also the chrome api as browserServces
    this is good and modular and will help us if we want to support other browsers that my have diffrenet implentatuion of the browser/chrome api
- **I NEED A TEST SUITE** , the project is getting harder to work on , i break things witout evene noticing and testing this shity code  is hard af 

    