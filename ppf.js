(function(self) {

  function assert(value, message) {
    if (!value) {
      throw new Error(message)
    }
  }

  function readUInt64LE(array, offset) {
    const buffer = array.buffer
    const view = new DataView(buffer)
    return view.getUint32(offset, true)
      | (view.getUint32(offset + 4, true) << 32)
  }

  function apply(ppf, bin) {
    const magic = new TextDecoder("utf-8").decode(ppf.subarray(0x00, 0x05))
    assert(magic === 'PPF30', 'Expocted a PP 3.0 patch file')
    assert(ppf[0x05] === 0x02, 'Expected a PPF 3.0 encoding method')
    assert(ppf[0x38] === 0x00, 'Expected a BIN patch file')
    assert([0x00, 0x01].indexOf(ppf[0x39]) !== -1, 'Invalid blockcheck value')
    let blockcheck = !!ppf[0x39]
    assert([0x00, 0x01].indexOf(ppf[0x3b]) !== -1, 'Invalid undo data value')
    let undo = !!ppf[0x3b]
    let c = 0x3c
    if (blockcheck) {
      c = 0x043c
    }
    while (c < ppf.length) {
      assert(ppf.length - c >= 8, 'Invalid PPF length')
      let address = readUInt64LE(ppf, c)
      c += 0x08
      assert(ppf.length - c >= 1, 'Invalid PPF length')
      const len = ppf[c++]
      if (undo) {
        assert(ppf.length - c >= 2 * len, 'Invalid PPF length')
      } else {
        assert(ppf.length - c >= len, 'Invalid PPF length')
      }
      let remaining = len
      while (remaining--) {
        bin[address++] = ppf[c++]
      }
      if (undo) {
        c += len
      }
    }
  }

  Object.assign(self || {}, {
    ppf: {
      apply: apply,
    },
  })
})(typeof(self) !== 'undefined' ? self : null)
