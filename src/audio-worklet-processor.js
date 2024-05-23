class RecorderProcessor extends AudioWorkletProcessor {
    process(inputs) {
      const input = inputs[0];
      if (input.length > 0) {
        const voice = input[0];
        this.port.postMessage(voice.buffer);
      }
      return true;
    }
  }
  
  registerProcessor('recorder-processor', RecorderProcessor);
  