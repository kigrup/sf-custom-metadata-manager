import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { js2xml, xml2js } from 'xml-js';

export function activate(context: vscode.ExtensionContext) {
	console.log('sf-custom-metadata-manager is now active!');

	const separators = ['tab', 'comma', 'semicolon'];
	const separatorMap: {
		[name: string]: string
	} = {
		tab: '\t',
		comma: ',',
		semicolon: ';'
	};

	let disposableReadAllIntoCSV = vscode.commands.registerCommand('sf-custom-metadata-manager.readAllIntoCSV', async () => {
		try {
			// Read all the custom metadata records files
			if (vscode.workspace.workspaceFolders?.length !== 1) {
				return;
			}
			let firstWorkspaceRoot = vscode.workspace.workspaceFolders[0];

			const customMetadataPath = path.join(firstWorkspaceRoot.uri.fsPath, 'force-app', 'main', 'default', 'customMetadata');
			let customMetadataRecordFilenames = fs.readdirSync(customMetadataPath);

			const customMetadataRecordTypes = customMetadataRecordFilenames.map((v) => {
				return v.split('.')[0];
			});

			// Create an array of unique metadata types and count the records for each one
			const uniqueRecordTypes = [...new Set(customMetadataRecordTypes)];
			let recordTypesCountMap: { [recordType: string]: number } = {};
			uniqueRecordTypes.forEach((recordType) => {
				recordTypesCountMap[recordType] = customMetadataRecordTypes.filter((fileName) => { return fileName === recordType; }).length;
			});

			// Create the labels the user will see to select the metadata type
			const recordTypesLabels = uniqueRecordTypes.map((recordType) => {
				return `${recordType} - ${recordTypesCountMap[recordType]} records`;
			});

			// Ask the user for the metadata type records to read
			const options = [/* 'All Metadata Types', */ ...recordTypesLabels];
			const selectedRecordTypeLabel = await vscode.window.showQuickPick(options, {
				placeHolder: 'Choose a custom metadata type or all of them'
			});

			// Ask the user for the value separator
			const selectedSeparator = await vscode.window.showQuickPick(separators, {
				placeHolder: 'Choose a value separator'
			});
			if (selectedSeparator === undefined) {
				return;
			}
			const separator = separatorMap[selectedSeparator];

			// Filter files to the selected type (or all)
			if (selectedRecordTypeLabel !== undefined && selectedRecordTypeLabel !== 'All Metadata Types'){
				const selectedRecordType = selectedRecordTypeLabel.split(' ')[0];
				if (selectedRecordType !== undefined) {
					customMetadataRecordFilenames = customMetadataRecordFilenames.filter((fileName) => {
						return fileName.startsWith(selectedRecordType);
					});
				}
			}
			
			// Read first record to save columns
			const firstFileName = customMetadataRecordFilenames[0];
			const firstFile = fs.readFileSync(path.join(customMetadataPath, firstFileName));
			const firstRecord = xml2js(firstFile.toString(), { compact: false });
			const fields: string[] = [];
			for (const element of firstRecord.elements[0].elements) {
				if (element.name === 'values') {
					for (const valuesElement of element.elements) {
						if (valuesElement.name === 'field') {
							const fieldName = valuesElement.elements[0].text;
							if (!fields.includes(fieldName)) {
								fields.push(fieldName);
							}
						}
					}
				}
			}

			// Parse each XML object into a clean object with the column values
			const mdtRecords = [];
			const baseColumns = ['customMetadataType', 'apiName', 'label'];
			const columns = [...baseColumns, ...fields];

			for (const fileName of customMetadataRecordFilenames) {
				const record: {
					customMetadataType: string,
					apiName: string,
					[field: string]: string | null
				} = {
					customMetadataType: fileName.split('.')[0],
					apiName: fileName.split('.')[1]
				};

				const file = fs.readFileSync(path.join(customMetadataPath, fileName));
				const recordFullXML = xml2js(file.toString());

				// Look for the fields found in the first record

				for (const element of recordFullXML.elements[0].elements) {
					if (element.name === 'label') {
						record.label = element.elements[0].text;
					}
					if (element.name === 'values') {
						const fieldObj = {
							fieldName: null,
							fieldValue: null
						};
						for (const valuesElement of element.elements) {
							if (valuesElement.name === 'field') {
								fieldObj.fieldName = valuesElement.elements[0].text;
							} else if (valuesElement.name === 'value') {
								if (valuesElement.elements !== undefined) {
									fieldObj.fieldValue = valuesElement.elements[0].text;
								}
							}
						}
						if (fieldObj.fieldName !== null) {
							record[fieldObj.fieldName] = fieldObj.fieldValue;
						}
					}
				}

				mdtRecords.push(record);
			}

			// Write all the clean data to a string
			let lines = [columns.join(separator)];
			for (const record of mdtRecords) {
				let line = `${record.customMetadataType}${separator}${record.apiName}${separator}${record.label}`;
				for (const field of fields) {
					if (record[field] !== undefined) {
						line += (record[field] !== null ? `${separator}${record[field]}` : separator);
					}
				}
				lines.push(line);
			}

			// Open document and write the data
			const document = await vscode.workspace.openTextDocument({
				language: 'csv',
				content: lines.join('\n')
			});

			vscode.window.showTextDocument(document);

			/* fs.writeFileSync(filePath, content, 'utf8');
			const openPath = vscode.Uri.file(filePath);
			vscode.workspace.openTextDocument(openPath).then(doc => {
				vscode.window.showTextDocument(doc);
			}); */

		} catch (e) {
			vscode.window.showErrorMessage('Something went wrong reading custom metadata records');
		}
	});

	let disposableUpdateFromCSV = vscode.commands.registerCommand('sf-custom-metadata-manager.updateFromCSV', async () => {
		try {
			// Read all the custom metadata records files
			if (vscode.workspace.workspaceFolders?.length !== 1) {
				return;
			}
			let firstWorkspaceRoot = vscode.workspace.workspaceFolders[0];

			const customMetadataPath = path.join(firstWorkspaceRoot.uri.fsPath, 'force-app', 'main', 'default', 'customMetadata');
			let mdtRecordFileNamesRead = fs.readdirSync(customMetadataPath);

			// Ask the user for the separator used in the file
			let selectedSeparator = await vscode.window.showQuickPick(separators, {
				placeHolder: 'Choose the value separator used in the file'
			});
			if (selectedSeparator === undefined) {
				return;
			}
			const separator = separatorMap[selectedSeparator];

			// Read the data from the open CSV file and construct the objects
			const data = vscode.window.activeTextEditor?.document.getText();
			if (data === undefined) {
				vscode.window.showInformationMessage('No file with data opened');
				return;
			}

			const lines = data.split('\n');
			if (lines === undefined) {
				vscode.window.showInformationMessage('Open file contains no data');
				return;
			}
			const firstLine = lines.shift();
			if (firstLine === undefined) {
				vscode.window.showInformationMessage('Open file contains no data');
				return;
			}

			const columns = firstLine.split(separator);
			const readRecords = [];

			for (const line of lines) {
				const readRecord: { [column: string]: string | null } = {};
				const values = line.split(separator);
				for (let v = 0; v < values.length; v++) {
					if (columns[v] !== undefined) {
						readRecord[columns[v]] = (values[v] === '' ? null : values[v]);
					}
				}
				if (readRecord.customMetadataType !== undefined && readRecord.apiName !== undefined) {
					readRecord._fileName = `${readRecord.customMetadataType}.${readRecord.apiName}.md-meta.xml`;
				}
				readRecords.push(readRecord);
			}

			for (const readRecord of readRecords) {
				if (readRecord._fileName !== undefined && readRecord._fileName !== null && mdtRecordFileNamesRead.includes(readRecord._fileName)) {
					const filePath = path.join(customMetadataPath, readRecord._fileName);
					const fileXMLString = fs.readFileSync(filePath).toString();
					const fileXMLObj = xml2js(fileXMLString, { compact: false });
					for (const element of fileXMLObj.elements[0].elements) {
						if (element.name === 'label' && readRecord.label !== undefined) {
							element.elements[0].text = readRecord.label;
						}
						if (element.name === 'values') {
							let fieldName;
							for (const valuesElement of element.elements) {
								if (valuesElement.name === 'field') {
									fieldName = valuesElement.elements[0].text;
								} else if (valuesElement.name === 'value' && fieldName !== undefined && readRecord[fieldName] !== undefined) {
									const readValue = readRecord[fieldName];
									if (readValue === null) {
										delete valuesElement.elements;
										delete valuesElement.attributes['xsi:type'];
										valuesElement.attributes['xsi:nil'] = 'true';
									} else {
										delete valuesElement.attributes['xsi:nil'];
										valuesElement.attributes['xsi:type'] = 'xsd:string';
										valuesElement.elements = [{
											type: 'text',
											text: readValue
										}];
									}
								}
							}
						}
					}
					const newXML = js2xml(fileXMLObj, { compact: false, spaces: 4 });
					fs.writeFileSync(filePath, newXML);
				}
			}

		} catch (e) {
			vscode.window.showErrorMessage('Something went wrong updating metadata files');
		}
	});

	context.subscriptions.push(disposableReadAllIntoCSV);
	context.subscriptions.push(disposableUpdateFromCSV);
}

// This method is called when your extension is deactivated
export function deactivate() {}
