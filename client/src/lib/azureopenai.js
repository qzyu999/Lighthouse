import { AzureOpenAI } from "openai";

// Reference: https://learn.microsoft.com/en-us/azure/ai-services/openai/chatgpt-quickstart?tabs=command-line,python-new&pivots=programming-language-javascript

const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || "<endpoint>";
const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY || "<api key>";
const apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION;
const deployment = import.meta.env.VITE_AZURE_OPENAI_MODEL;

const model = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment, dangerouslyAllowBrowser: true });

export default model;
