import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from 'node-html-markdown'

let converterOptions: Partial<NodeHtmlMarkdownOptions> | null = null;
let converter: NodeHtmlMarkdown | null = null;

export function getConverterOptions(): Partial<NodeHtmlMarkdownOptions> {
    if (!converterOptions) {
        converterOptions = {
            ignore: ['script', 'style'],
            useLinkReferenceDefinitions: true            
        };
    }

    return converterOptions;
}

export function getConverter(): NodeHtmlMarkdown {
    if (!converter) {
        converter = new NodeHtmlMarkdown(getConverterOptions());
    }

    return converter;
}
