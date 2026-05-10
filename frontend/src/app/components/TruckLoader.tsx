import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

export interface GlobalLoaderProps {
  /** Optional title below the terminal (e.g. "Loading Contests") */
  message?: string;
  /** Optional subtitle (e.g. "Fetching upcoming coding competitions...") */
  submessage?: string;
  /** If true, wraps in a full-page centered container (min-h-screen) */
  fullPage?: boolean;
}

const Loader = ({ message, submessage, fullPage = false }: GlobalLoaderProps) => {
  const content = (
    <StyledWrapper>
      <div className="terminal-loader">
        <div className="terminal-header">
          <div className="terminal-title">Status</div>
          <div className="terminal-controls">
            <div className="control close" />
            <div className="control minimize" />
            <div className="control maximize" />
          </div>
        </div>
        <div className="text">Loading...</div>
      </div>
      {(message != null || submessage != null) && (
        <motion.div
          className="mt-6 text-center space-y-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {message != null && (
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {message}
            </p>
          )}
          {submessage != null && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {submessage}
            </p>
          )}
        </motion.div>
      )}
    </StyledWrapper>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary py-12">
        {content}
      </div>
    );
  }

  return content;
};

const StyledWrapper = styled.div`
  @keyframes blinkCursor {
    50% {
      border-right-color: transparent;
    }
  }

  @keyframes typeAndDelete {
    0%,
    10% {
      width: 0;
    }
    45%,
    55% {
      width: 6.2em;
    } /* adjust width based on content */
    90%,
    100% {
      width: 0;
    }
  }

  .terminal-loader {
    border: 0.1em solid #333;
    background-color: #1a1a1a;
    color: #0f0;
    font-family: "Courier New", Courier, monospace;
    font-size: 1em;
    padding: 1.5em 1em;
    width: 12em;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }

  .terminal-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1.5em;
    background-color: #333;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    padding: 0 0.4em;
    box-sizing: border-box;
  }

  .terminal-controls {
    float: right;
  }

  .control {
    display: inline-block;
    width: 0.6em;
    height: 0.6em;
    margin-left: 0.4em;
    border-radius: 50%;
    background-color: #777;
  }

  .control.close {
    background-color: #e33;
  }

  .control.minimize {
    background-color: #ee0;
  }

  .control.maximize {
    background-color: #0b0;
  }

  .terminal-title {
    float: left;
    line-height: 1.5em;
    color: #eee;
  }

  .text {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    border-right: 0.2em solid green; /* Cursor */
    animation:
      typeAndDelete 4s steps(11) infinite,
      blinkCursor 0.5s step-end infinite alternate;
    margin-top: 1.5em;
  }`;

export default Loader;
export { Loader as GlobalLoader };
