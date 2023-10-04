# SMS AutoResponder 

## Introduction
SMS Auto Responder is an Azure Serverless function, that responds to incoming SMS messages with a static response. 
The response returned is derived from the incoming body. 

## Version 1
The current requirement is a pretty constrained simple use case. 
The goal is to return a pre-configured response for a given message identified by a key.

For example, 

Input: Apply WOTC, 
Output: You are invited for WOTC with XYZ company here is the link https://www....

Input: Apply 2023 Intern etc
Output: Welcome to the intern program at ACME. Apply here https://www....

## Setup

The app contains two azure resources

1. An azure function - api
2. An externalized azure blob storage with one container - data

To configure the app the deployment should setup 3 env vars

process.env.AZURE_STORAGE_ACCOUNT_NAME == data.name             // the storage name
process.env.AZURE_STORAGE_ACCOUNT_KEY == data.key               // the storage key
process.env.AZURE_STORAGE_CONTAINER_NAME == data.container.name // the name of a container to hold the message files


## To Test

1. Checkout Project
2. $ pnpm install                   # to install all deps
3. $ pnpm test or pnpm coverage     # coverage generates the report in a subfolder called 'coverage'

## To Test via REST client

read the e2e.http

## Twilio Provider
The current version will use Twilio as the provider and here is the same incoming payload.

{
  ToCountry: 'US',
  ToState: 'FL',
  SmsMessageSid: 'xxx',
  NumMedia: '0',
  ToCity: 'YOUNGSTOWN',
  FromZip: '',
  SmsSid: 'xxx',
  FromState: 'Ontario',
  SmsStatus: 'received',
  FromCity: 'Toronto',
  Body: 'APPLY ABC', // <---- Used as KEY or File Name
  FromCountry: 'CA',
  To: '+1xxxx',
  MessagingServiceSid: 'xxx',
  ToZip: '32409',
  NumSegments: '1',
  MessageSid: 'xxx',
  AccountSid: 'xxx',
  From: '+1xxxx',
  ApiVersion: '2010-04-01'
}


## Implementation notes

1. All Message Templates are stored by the KEY in an Azure Blob Storage
2. The function looks up for a blob/file in a designated (configurable) container in a blob store
3. The function uses Twilio SDK to generate a valid TwiML response XML