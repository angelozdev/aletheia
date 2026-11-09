export function captureStream(): { write(chunk: string): boolean; text(): string } {
  let captured = ''
  return {
    write(chunk: string) {
      captured += chunk
      return true
    },
    text() {
      return captured
    },
  }
}
