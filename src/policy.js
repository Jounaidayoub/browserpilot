
console.log("Setting up Trusted Types policy for content script.");
try {
    // CRITICAL : NEED TO FIND A WORK AROUND THIS , THIS IS UNSAFE 
    const result =trustedTypes.createPolicy('default', {

    createHTML: string => string,

    createScriptURL: string => string,

    createScript: string => string,
    });

console.log("Trusted Types policy creation result:", result);

// console.log("Trusted Types policy 'default' created successfully.");
} catch (e) {
console.error("Error setting up Trusted Types policy:", e);
}
