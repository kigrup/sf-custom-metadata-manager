# Custom Metadata Manager - Salesforce

This extension helps developers manage their organization's custom metadata records by allowing <b>bulk updates</b>, something not currently supported by the Salesforce CLI.

SFDX is necessary to be able to retrieve and deploy custom metadata records, take a look at the [Salesforce Extension Pack](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode) if you don't have it. This extension is only a utility that modifies the organization project files. It **does not** deploy changes to Salesforce organizations.

## How to use it

First of all, it's important to know how SFDX handles custom metadata records. Once you've authorized an organization, using the Org Browser you can download all the custom metadata.

To update or work with current records, make sure the files were correctly downloaded to the "customMetadata" folder.

A good way to start using the extension is to run the "read all into CSV" command.

With this file as a template, you can modify the existing lines or add new ones to create records. When you're done you can run the "update from open CSV" command. This works as an "upsert" on the local files.

Now you can deploy all the files you want at the same time to apply the changes in Salesforce.

## Limitations

This extension is a **preview**, there is still a lot of room for improvement as it does not support all data types and characters in the field values. There are plenty of use cases where the files are not generated or updated correctly. If you find any issues, have suggestions or want to offer help, feel free to contact me. I'm planning on open-sourcing the code too.
