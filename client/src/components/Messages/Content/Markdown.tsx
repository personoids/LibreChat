import React, { useState, useEffect } from 'react';
import type { TMessage } from 'librechat-data-provider';
import { useRecoilValue } from 'recoil';
import ReactMarkdown from 'react-markdown';
import type { PluggableList } from 'unified';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import remarkMath from 'remark-math';
import supersub from 'remark-supersub';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import CodeBlock from './CodeBlock';
import { langSubset, validateIframe } from '~/utils';
import store from '~/store';

type TCodeProps = {
  inline: boolean;
  className: string;
  children: React.ReactNode;
};

type TContentProps = {
  content: string;
  message: TMessage;
  showCursor?: boolean;
};

const code = React.memo(({ inline, className, children}: TCodeProps) => {
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
const p = React.memo(({ children }: { children: React.ReactNode }) => {
  return <p className="mb-2 whitespace-pre-wrap">{children}</p>;
});

const Markdown = React.memo(({ content, message, showCursor }: TContentProps) => {
  const [cursor, setCursor] = useState('█');
  const isSubmitting = useRecoilValue(store.isSubmitting);
  const latestMessage = useRecoilValue(store.latestMessage);
  const isInitializing = content === '<span className="result-streaming">█</span>';

  const { isEdited, messageId } = message ?? {};
  const isLatestMessage = messageId === latestMessage?.messageId;
  const currentContent = content?.replace('z-index: 1;', '') ?? '';

  useEffect(() => {
    let timer1: NodeJS.Timeout, timer2: NodeJS.Timeout;

    if (!showCursor) {
      setCursor('ㅤ');
      return;
    }

    if (isSubmitting && isLatestMessage) {
      timer1 = setInterval(() => {
        setCursor('ㅤ');
        timer2 = setTimeout(() => {
          setCursor('█');
        }, 200);
      }, 1000);
    } else {
      setCursor('ㅤ');
    }

    // This is the cleanup function that React will run when the component unmounts
    return () => {
      clearInterval(timer1);
      clearTimeout(timer2);
    };
  }, [isSubmitting, isLatestMessage, showCursor]);

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
  ];

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
    p,
  } as { [nodeType: string]: React.ElementType };

  return (
    <ReactMarkdown
      remarkPlugins={[supersub, remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
      rehypePlugins={rehypePlugins}
      linkTarget="_new"
      components={components}
    >
      {isLatestMessage && isSubmitting && !isInitializing
        ? currentContent + cursor
        : currentContent}
    </ReactMarkdown>
  );
});

export default Markdown;
