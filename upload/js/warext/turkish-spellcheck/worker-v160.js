'use strict';

importScripts('dictionary-v160.js','rules-v160.js');

self.onmessage = event => {
  const data = event.data || {};
  const id = data.id;
  if (data.type === 'ping') {
    self.postMessage({id,type:'pong',version:'1',build:'1.6.0'});
    return;
  }
  if (data.type !== 'analyze') return;
  try {
    const result = self.WarextTurkishRulesV160.analyze(String(data.text || ''),data.payload || {});
    self.postMessage({id,type:'result',result});
  } catch (error) {
    self.postMessage({id,type:'error',message:String(error?.message || error)});
  }
};
