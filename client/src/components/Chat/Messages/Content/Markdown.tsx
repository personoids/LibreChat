import React, { memo, useMemo } from 'react';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import supersub from 'remark-supersub';
import rehypeKatex from 'rehype-katex';
import { useRecoilValue } from 'recoil';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import type { TMessage } from 'librechat-data-provider';
import type { PluggableList } from 'unified';
import { cn, langSubset, validateIframe, processLaTeX } from '~/utils';
import CodeBlock from '~/components/Messages/Content/CodeBlock';
import { useChatContext, useToastContext } from '~/Providers';
import { useFileDownload } from '~/data-provider';
import useLocalize from '~/hooks/useLocalize';
import store from '~/store';
import rehypeReact from 'rehype-react';
import rehypeParse from 'rehype-parse';
import rehypeVideo from 'rehype-video';

import * as prod from 'react/jsx-runtime'
// @ts-expect-error: the react types are missing.
const production = {Fragment: prod.Fragment, jsx: prod.jsx, jsxs: prod.jsxs,
  createElement: React.createElement,
  components: {}
}

type TCodeProps = {
  inline: boolean;
  className?: string;
  children: React.ReactNode;
};

type TContentProps = {
  content: string;
  message: TMessage;
  showCursor?: boolean;
};

export const code = memo(({ inline, className, children }: TCodeProps) => {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match && match[1];
  if(lang === 'action') {
    // content is in the form of:
    // type: conv-button
    // user_label: Student Personoids
    // message: student
    // auto-send: true
    const lines = children
      .toString()
      .split('\n')
      .map((line) => line.trim());
    const type = lines[0].split(': ')[1];
    if(type === 'conv-button') {
      if(lines.length < 4) return (<></>);
      const user_label = lines[1].split(': ')[1];
      const message = lines[2].split(': ')[1];
      const autoSend = lines[3].split(': ')[1] === 'true';
      return (
        <button className="btn btn-secondary"
          onClick={() => {
            const inputBox = document.getElementById('prompt-textarea');
            if (inputBox) {
              Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value').set.call(inputBox, message);
              
              inputBox.dispatchEvent(new Event('input', { bubbles: true }));
              
              if (autoSend) {
                setTimeout(() => {                
                    let sendButton = document.querySelector('button[data-testid="send-button"]');
                    if(!sendButton) 
                      sendButton = document.querySelector('button[data-testid="fruitjuice-send-button"]');
                    if (sendButton) {
                      sendButton.click();
                    }
                  }, 100)
              }
            }
          }}
        >
          {user_label}
        </button> );  
    }    
  }
  if (inline) {
    return <code className={className}>{children}</code>;
  } else {
    return <CodeBlock lang={lang || 'text'} codeChildren={children} />;
  }
});

export const a = memo(({ href, children }: { href: string; children: React.ReactNode }) => {
  const user = useRecoilValue(store.user);
  const { showToast } = useToastContext();
  const localize = useLocalize();

  const { file_id, filename, filepath } = useMemo(() => {
    const pattern = new RegExp(`(?:files|outputs)/${user?.id}/([^\s]+)`);
    const match = href.match(pattern);
    if (match && match[0]) {
      const path = match[0];
      const parts = path.split('/');
      const name = parts.pop();
      const file_id = parts.pop();
      return { file_id, filename: name, filepath: path };
    }
    return { file_id: '', filename: '', filepath: '' };
  }, [user?.id, href]);

  const { refetch: downloadFile } = useFileDownload(user?.id ?? '', file_id);
  const props: { target?: string; onClick?: React.MouseEventHandler } = { target: '_new' };

  if (!file_id || !filename) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  const handleDownload = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    try {
      const stream = await downloadFile();
      if (!stream.data) {
        console.error('Error downloading file: No data found');
        showToast({
          status: 'error',
          message: localize('com_ui_download_error'),
        });
        return;
      }
      const link = document.createElement('a');
      link.href = stream.data;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(stream.data);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  props.onClick = handleDownload;
  props.target = '_blank';

  return (
    <a
      href={filepath.startsWith('files/') ? `/api/${filepath}` : `/api/files/${filepath}`}
      {...props}
    >
      {children}
    </a>
  );
});

export const p = memo(({ children }: { children: React.ReactNode }) => {
  return <p className="mb-2 whitespace-pre-wrap">{children}</p>;
});

const cursor = ' ';
const Markdown = memo(({ content, message, showCursor }: TContentProps) => {
  const { isSubmitting, latestMessage } = useChatContext();
  const LaTeXParsing = useRecoilValue<boolean>(store.LaTeXParsing);

  const isInitializing = content === '';

  const { isEdited, messageId } = message ?? {};
  const isLatestMessage = messageId === latestMessage?.messageId;

  let currentContent = content;
  if (!isInitializing) {
    currentContent = currentContent?.replace('z-index: 1;', '') ?? '';
    currentContent = LaTeXParsing ? processLaTeX(currentContent) : currentContent;
  }
  // https://github.com/marko-knoebl/rehype-inline?

  const rehypePlugins: PluggableList = [
    [rehypeKatex, { output: 'mathml' }],
    [
      rehypeHighlight,
      {
        detect: true,
        ignoreMissing: true,
        subset: langSubset,
      },
    ],
    [rehypeRaw],
    [rehypeParse, { fragment: true }],
    [rehypeReact, { production }],    
    [rehypeVideo]    
  ];

  if (isInitializing) {
    rehypePlugins.pop();
    return (
      <div className="absolute">
        <p className="relative">
          <span className={cn(isSubmitting ? 'result-thinking' : '')} />
        </p>
      </div>
    );
  }

  let isValidIframe: string | boolean | null = false;
  if (!isEdited) {
    isValidIframe = validateIframe(currentContent);
  }
  isValidIframe = true;
  // if (isEdited || ((!isInitializing || !isLatestMessage) && !isValidIframe)) {
  //   rehypePlugins.pop();
  // }

  const components = {
    code,
    a,
    p,
  } as { [nodeType: string]: React.ElementType };
  return (
    <ReactMarkdown
      remarkPlugins={[supersub, remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
      rehypePlugins={rehypePlugins}
      remarkRehypeOptions = {{ allowDangerousHtml: true }}      
      linkTarget="_new"
      components={components}
    >
      {isLatestMessage && isSubmitting && !isInitializing && showCursor
        ? currentContent + cursor
        : currentContent}
    </ReactMarkdown>
  );
});

export default Markdown;
