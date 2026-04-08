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
- to get some free llm credeuts for free users we can use openrouter as an oauth prvider thet offer an aothe server so users can use the free tier 
moders abd their credids there with a smooth oauth sign in expreirecne
    
## some notes and findings 
- regaring the get_tab_contetn tool , we have tried various appprocahe , playwright aria ai optmized snahsots(but they are not content dense they are good for actions taking , not for info dense taks like summeEIng and explainging)
- we tired plain textcontetn from the dom body using the mozzila readailty standalone package , efficant but does not include valid links and hirechy sturcture
- we tried html->md libres for now we areing stincky with dom-to-semantic-markdown , even though it sturguesl with nested layouts (hackernews nested tables sturcture for example , it does blow up the whole thing need some warings at the tool level), we have aslo this approach usig the turndownjs look at this https://github.com/badlogic/pi-skills/blob/main/browser-tools/browser-content.js 
- also take a look at these implmentatiosn https://github.com/SawyerHood/dev-browser/blob/main/skills/dev-browser/src/snapshot/browser-script.ts form the browserskill , looks very efficant , 