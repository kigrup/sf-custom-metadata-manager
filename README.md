# Custom Metadata Manager - Salesforce

This extension helps developers manage their organization's custom metadata records by allowing <b>bulk updates</b>, something not currently supported by the Salesforce CLI.

SFDX is necessary to be able to retrieve and deploy custom metadata records, take a look at the [Salesforce Extension Pack](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode) if you don't have it. This extension is only a utility that modifies the organization project files. It **does not** deploy changes to Salesforce organizations.

## How to use it

First of all, it's important to know how SFDX handles custom metadata records. Once you've authorized an organization, using the Org Browser you can download all the custom metadata.

![howto1](https://github.com/kigrup/sf-custom-metadata-manager/assets/41707166/b76515d6-88a6-4a86-8e88-522c5b950cac)

To update or work with current records, make sure the files were correctly downloaded to the "customMetadata" folder.

![howto2](https://github.com/kigrup/sf-custom-metadata-manager/assets/41707166/b2225d7f-0115-4ff1-9c95-1433a678d650)

A good way to start using the extension is to run the "read all into CSV" command.

![howto3](https://github.com/kigrup/sf-custom-metadata-manager/assets/41707166/af51f3a6-3439-406e-8cb3-3811f2a9a791)

With this file as a template, you can modify the existing lines or add new ones to create records. When you're done you can run the "update from open CSV" command. This works as an "upsert" on the local files.

![howto4](https://github.com/kigrup/sf-custom-metadata-manager/assets/41707166/c5376d58-3325-49af-a7f7-ab70c2f6e915)

Now you can deploy all the files you want at the same time to apply the changes in Salesforce. 

![howto5](https://github.com/kigrup/sf-custom-metadata-manager/assets/41707166/166df020-6e93-4a4c-93c9-0c7348209c8c)

Pay attention to the output terminal to make sure there was no issue with the deployment.

![howto6](https://github.com/kigrup/sf-custom-metadata-manager/assets/41707166/86c65ae4-d241-4f54-a25d-ae7b000683a7)

## Limitations

This extension is a **preview**, there is still a lot of room for improvement as it does not support all data types and characters in the field values. There are plenty of use cases where the files are not generated or updated correctly. If you find any issues, have suggestions or want to offer help, feel free to contact me. I'm planning on open-sourcing the code too.
