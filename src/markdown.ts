import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from 'node-html-markdown'

let converterOptions: Partial<NodeHtmlMarkdownOptions> | null = null;
let converter: NodeHtmlMarkdown | null = null;

export function getConverterOptions(): Partial<NodeHtmlMarkdownOptions> {
    if (!converterOptions) {
        converterOptions = {
            ignore: ['script', 'style'],
            useLinkReferenceDefinitions: false,  // I set this to false, as link reference format was causing issues with truncated links
            keepDataImages: false,
            maxConsecutiveNewlines: 2
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
