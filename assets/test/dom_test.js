import DOM from "phoenix_live_view/dom"
import {appendTitle, tag} from "./test_helpers"

describe("DOM", () => {
  beforeEach(() => {
    let curTitle = document.querySelector("title")
    curTitle && curTitle.remove()
  })

  describe("putTitle", () => {
    test("with no attributes", () => {
      appendTitle({})
      DOM.putTitle("My Title")
      expect(document.title).toBe("My Title")
    })

    test("with prefix", () => {
      appendTitle({prefix: "PRE "})
      DOM.putTitle("My Title")
      expect(document.title).toBe("PRE My Title")
    })

    test("with suffix", () => {
      appendTitle({suffix: " POST"})
      DOM.putTitle("My Title")
      expect(document.title).toBe("My Title POST")
    })

    test("with prefix and suffix", () => {
      appendTitle({prefix: "PRE ", suffix: " POST"})
      DOM.putTitle("My Title")
      expect(document.title).toBe("PRE My Title POST")
    })
  })

  describe("findParentCIDs", () => {
    test("returns only parent cids", () => {
      let view = tag("div", {}, `
        <div data-phx-main="true"
            data-phx-session="123"
            data-phx-static="456"
            id="phx-123"
            class="phx-connected"
            data-phx-root-id="phx-FgFpFf-J8Gg-jEnh">
        </div>
      `)
      document.body.appendChild(view)

      expect(DOM.findParentCIDs(view, [1, 2, 3])).toEqual(new Set([1, 2, 3]))

      view.appendChild(tag("div", {"data-phx-component": 1}, `
        <div data-phx-component="2"></div>
      `))
      expect(DOM.findParentCIDs(view, [1, 2, 3])).toEqual(new Set([1, 3]))

      view.appendChild(tag("div", {"data-phx-component": 1}, `
        <div data-phx-component="2">
          <div data-phx-component="3"></div>
        </div>
      `))
      expect(DOM.findParentCIDs(view, [1, 2, 3])).toEqual(new Set([1]))
    })
  })

  describe("findComponentNodeList", () => {
    test("returns nodes with cid ID (except indirect children)", () => {
      let component1 = tag("div", {"data-phx-component": 0}, "Hello")
      let component2 = tag("div", {"data-phx-component": 0}, "World")
      let component3 = tag("div", {"data-phx-session": "123"}, `
        <div data-phx-component="0"></div>
      `)
      document.body.appendChild(component1)
      document.body.appendChild(component2)
      document.body.appendChild(component3)

      expect(DOM.findComponentNodeList(document, 0)).toEqual([component1, component2])
    })

    test("returns empty list with no matching cid", () => {
      expect(DOM.findComponentNodeList(document, 123)).toEqual([])
    })
  })

  test("isNowTriggerFormExternal", () => {
    let form
    form = tag("form", {"phx-trigger-external": ""}, "")
    expect(DOM.isNowTriggerFormExternal(form, "phx-trigger-external")).toBe(true)

    form = tag("form", {}, "")
    expect(DOM.isNowTriggerFormExternal(form, "phx-trigger-external")).toBe(false)
  })

  describe("cleanChildNodes", () => {
    test("only cleans when phx-update is append or prepend", () => {
      let content = `
      <div id="1">1</div>
      <div>no id</div>

      some test
      `.trim()

      let div = tag("div", {}, content)
      DOM.cleanChildNodes(div, "phx-update")

      expect(div.innerHTML).toBe(content)
    })

    test("silently removes empty text nodes", () => {
      let content = `
      <div id="1">1</div>


      <div id="2">2</div>
      `.trim()

      let div = tag("div", {"phx-update": "append"}, content)
      DOM.cleanChildNodes(div, "phx-update")

      expect(div.innerHTML).toBe("<div id=\"1\">1</div><div id=\"2\">2</div>")
    })

    test("emits warning when removing elements without id", () => {
      let content = `
      <div id="1">1</div>
      <div>no id</div>

      some test
      `.trim()

      let div = tag("div", {"phx-update": "append"}, content)

      let errorCount = 0
      jest.spyOn(console, "error").mockImplementation(() => errorCount += 1)
      DOM.cleanChildNodes(div, "phx-update")

      expect(div.innerHTML).toBe("<div id=\"1\">1</div>")
      expect(errorCount).toBe(2)
    })
  })

  describe("formControls", () => {
    test("returns an empty Array when form is not an HTMLFormElement", () => {
      let div = tag("div", {"id": "div"}, "")
      document.body.appendChild(div)
      expect(DOM.formControls(div)).toEqual([])
    })

    test("returns all control elements associated with a form", () => {
      let formId = "form-controls-form"
      let form = tag("form", {"id": formId}, "")
      let inControls = [
        tag("input", {"type": "text"}, ""),
        tag("select", {}, ""),
        tag("textarea", {}, ""),
        tag("button", {}, "Submit"),
        tag("input", {"type": "file"}, ""),
      ]
      inControls.forEach((ctrl) => form.appendChild(ctrl))
      document.body.appendChild(form)

      let outControls = [
        tag("input", {"form": formId, "type": "text"}, ""),
        tag("select", {"form": formId}, ""),
        tag("textarea", {"form": formId}, ""),
        tag("button", {"form": formId}, "Submit"),
        tag("input", {"form": formId, "type": "file"}, ""),
      ]
      outControls.forEach((ctrl) => document.body.appendChild(ctrl))

      let allControls = inControls.concat(outControls)
      expect(DOM.formControls(form)).toEqual(allControls)
    })
  })

  describe("findUploadInputs", () => {
    test("returns all `live_file_input` elements associated with a form", () => {
      let inputIn = tag("input", {"type": "text", "id": "text-In"}, "")
      let selectIn = tag("select", {"id": "select-In"}, "")
      let textareaIn = tag("textarea", {"id": "textarea-In"}, "")
      let submitIn = tag("button", {"type": "submit-In"}, "Submit")
      let fileIn = tag("input", {"type": "file", "id": "file-In"}, "")
      let liveFileIn = tag("input", {"type": "file", "id": "live-file-In", "data-phx-upload-ref": 0}, "")

      let formId = "find-upload-inputs-form"
      let form = tag("form", {"id": formId}, "")
      form.appendChild(inputIn)
      form.appendChild(selectIn)
      form.appendChild(textareaIn)
      form.appendChild(submitIn)
      form.appendChild(fileIn)
      form.appendChild(liveFileIn)
      document.body.appendChild(form)

      let inputOut = tag("input", {"form": formId, "name": "inputOut", "type": "text", "id": "text-Out"}, "")
      let selectOut = tag("select", {"form": formId, "id": "select-Out"}, "")
      let textareaOut = tag("textarea", {"form": formId, "id": "textarea-Out"}, "")
      let submitOut = tag("button", {"form": formId, "type": "submit-Out"}, "Submit")
      let fileOut = tag("input", {"form": formId, "type": "file", "id": "file-Out"}, "")
      let liveFileOut = tag("input", {"form": formId, "type": "file", "id": "live-file-Out", "data-phx-upload-ref": 1}, "")

      document.body.appendChild(inputOut)
      document.body.appendChild(selectOut)
      document.body.appendChild(textareaOut)
      document.body.appendChild(submitOut)
      document.body.appendChild(fileOut)
      document.body.appendChild(liveFileOut)

      expect(DOM.findUploadInputs(form)).toEqual([liveFileIn, liveFileOut])
    })
  })
})
