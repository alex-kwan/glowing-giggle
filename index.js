const { spawnSync } = require('child_process');
const fs = require('fs');
const appSettingsTemplate = require('./appsettings.template.json');

//let a = JSON.parse(appSettingsTemplate);

// createAppInsightsResource('appinsights-resource', 'westus', 'rg-alextestgroup');
// Azure CLI command to list resource groups
// console.log(`resource group id is ${stdout.id}`)
azure('az group list --output table');

// console.log(azure(showResourceGroupChildren('rg-alextestgroup')));
// createCommunicationResource('comm-alextest', 'global', 'Canada', 'rg-alextestgroup');
for (const key in appSettingsTemplate) {
    if (appSettingsTemplate.hasOwnProperty(key)) {
      const properties = appSettingsTemplate[key];
      if (properties.type == 'Microsoft.Communication/CommunicationServices') {
        if (properties.property == 'hostName') {
            appSettingsTemplate[key] = JSON.parse(showCommunicationResource(properties.resourceName, properties.resourceGroupName)).properties.hostName;
        }
        else if (properties.property == 'primaryConnectionString' || properties.property == 'secondaryConnectionString') {
            appSettingsTemplate[key] = JSON.parse(listKeysCommunicationResource(properties.resourceName, properties.resourceGroupName))[properties.property];
        }
      }
      else if (properties.type == "microsoft.insights/components") {
        if (properties.property == 'instrumentationKey') {
            appSettingsTemplate[key] = JSON.parse(showAppInsightsResource(properties.resourceName, properties.resourceGroupName, properties.property));
        }
      }
    }
}
 
writeJSONToFile(appSettingsTemplate, './appsettings.json');

function writeJSONToFile(jsonData, filePath) {
    const jsonString = JSON.stringify(jsonData, null, 2);

    // Write JSON string to a file
    fs.writeFile('appsettings.json', jsonString, (err) => {
        if (err) {
        console.error('Error writing file', err);
        } else {
        console.log('JSON data written to file successfully');
        }
    });
}

function azure(cmd) {
    const result = spawnSync(cmd, { shell: true, encoding: 'utf-8' });
  
    if (result.error) {
      console.error(`Error: ${result.error.message}`);
      return errorJSONObject();
    }
    if (result.stderr) {
      console.error(`stderr: ${result.stderr}`);
      return stdErrorJSONObject();
    }
   console.log(`stdout: ${result.stdout}`);
    return result.stdout;
}

function azureAsJson(cmd) {
    return JSON.parse(azure(cmd));
}

function errorJSONObject() {
    return {
        "message": "There was an error, please refer to the error object off of the result",
    }
}

function stdErrorJSONObject() {
    return {
        "message": "There was an error, please refer to the stderror object off of the result",
    }
}

function createResourceGroup(name, location) {
    return azure(`az group create \
        --name ${name} \
        --location ${location} \
        --output json`);
}

function showResourceGroup(name) {
    return azure(`az group show \
        --name ${name} \
        --output json`);
}

function deleteResourceGroup(name) {
    return azure(`az group delete \
        --name ${name} \
        --yes \
        --output json`);
}

function showResourceGroupChildren(name) {
    return azure(`az resource list \
        --resource-group ${name} \
        --output table`)
}

// 1-50 characteers more start iwth a letter and end with alphanumeric and only charcters and hypphens
// do not use # or any reserved words or traddemarks
// example name MyCommuncationService123
// resourceName 
// location eg westus
// resourcegroup name
function createCommunicationResource(resourceName, location, dataLocation, resourceGroupName) {
    return azure(`az communication create --name ${resourceName} \
        --location ${location} \
        --resource-group ${resourceGroupName} \
        --data-location ${dataLocation} \
        --output json`);
}

// used for getting endpointUrl
function showCommunicationResource(resourceName, resourceGroupName) {
    return azure(`az resource show \
        --resource-group ${resourceGroupName} \
        --name ${resourceName} \
        --resource-type Microsoft.Communication/CommunicationServices \
        --output json`);
}

// used for getting connection strings
function listKeysCommunicationResource(resourceName, resourceGroupName) {
    return azure(`az communication list-key \
        --resource-group ${resourceGroupName} \
        --name ${resourceName} \
        --output json`);
}

function deleteCommunicationResource(resourceName, location, resourceGroupName) {
    return azure(`az resource delete \
        --resource-group ${resourceGroupName} \
        --name ${resourceName} \
        --resource-type Microsoft.Communication/CommunicationServices \
        --output json`);
}

// create azure monitor 

function createAppInsightsResource(resourceName, location, resourceGroupName) {
    return azure(`az monitor app-insights component create \
        --app ${resourceName} \
        --location ${location} \
        --resource-group ${resourceGroupName} \
        --kind web \
        --application-type web`);
}

function showAppInsightsResource(resourceName, resourceGroupName, property) {
    return azure(`az monitor app-insights component show \
        --resource-group ${resourceGroupName} \
        --app ${resourceName} \
        --query  ${property} \
        --output json`);
}

function deleteAppInsightsResource(resourceName, resourceGroupName) {
    return azure(`az monitor app-insights component delete \
        --app ${resourceName} \
        --resource-group ${resourceGroupName}`);
}
// create blob storage

function createStorageAccountResource(resourceName, resourceGroupName, location, sku) {
    return azure(`az storage account create \
        --name ${resourceName}
        --resource-group ${resourceGroupName} \
        --location ${location} \
        --sku ${sku}
        --output json`)
}

function createStorageContainer(resourceName, containerName) {
    return azure(`az storage container create \
        --account-name ${resourceName} \
        --name ${containerName}
        --output json`)
}

function showConnectionStringFromStorageAccount(resourceName, resourceGroupName, query) {
    return azure(`az storage account show-connection-string \
        --name ${resourceName} \
        --resource-group ${resourceGroupName} \
        -- query ${query} \
        --output json`)
}

function removeStorageAccountResource(resourceName, resourceGroupName) {
    return azure(`az storage account delete \
        --name ${resourceName}
        --resource-group ${resourceGroupName} \
        --output json`)
}

function removeStorageContainer(resourceName, containerName) {
    return azure(`az storage container delete \
        --account-name ${resourceName} \
        --name ${containerName}
        --output json`)
}

function createCognitiveServicesResource(resourceName, resourceGroupName, cognitiveServiceKind, sku, location) {
    return azure(`az cognitiveservices account create \
    --name ${resourceName} \
    --resource-group ${resourceGroupName} \
    --kind ${cognitiveServiceKind} \
    --sku ${sku} \
    --location ${location}
    --output json`);
}

// const connectionString = `Endpoint=https://${resourceName}.cognitiveservices.azure.com/;ApiKey=${keys.key1}`

function getCognitiveServicesResource(resourceName, resourceGroupName) {
    return azure(`az cognitiveservices account keys list --name ${resourceName} \
        --resource-group ${resourceGroupName} \
        --output json`);
}

function getCognitiveServicesResourceConnectionString(resourceName, key) {
    return `Endpoint=https://${resourceName}.cognitiveservices.azure.com/;ApiKey=${key}`
}

function deleteCognitiveServicesResource(resourceName, resourceGroupName) {
    return azure(`az cognitiveservices account delete \
    --name ${resourceName} \
    --resource-group ${resourceGroupName}
    --output json`);
}