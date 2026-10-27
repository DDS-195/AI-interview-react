// 保持同一个 EditorView，通过 Compartment 更新主题、语言与只读状态。
import { useEffect, useRef } from 'react'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { useThemeContext } from '../contexts/ThemeContext'
import type { CodeLanguage } from '../types'

interface CodeEditorProps {
  language?: CodeLanguage
  value: string
  onChange: (value: string) => void
  visible: boolean
  disabled?: boolean
}

export default function CodeEditor({
  value,
  onChange,
  visible,
  disabled = false,
  language = 'javascript'
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const initialValueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const { isDark } = useThemeContext()
  const themeRef = useRef(isDark)
  themeRef.current = isDark
  const editing = useRef(new Compartment())
  const appearance = useRef(new Compartment())
  const syntax = useRef(new Compartment())
  const languageRef = useRef(language)
  languageRef.current = language
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  onChangeRef.current = onChange

  useEffect(() => {
    if (!editorRef.current) {
      return
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !disabledRef.current) {
        const doc = update.state.doc.toString()
        onChangeRef.current(doc)
      }
    })

    const state = EditorState.create({
      doc: initialValueRef.current,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        syntax.current.of(
          ['html', 'css'].includes(languageRef.current)
            ? []
            : javascript({ typescript: languageRef.current === 'typescript', jsx: true })
        ),
        appearance.current.of(themeRef.current ? oneDark : []),
        EditorView.contentAttributes.of({
          role: 'textbox',
          'aria-label': '代码答案',
          'aria-multiline': 'true'
        }),
        editing.current.of([
          EditorState.readOnly.of(disabledRef.current),
          EditorView.editable.of(!disabledRef.current)
        ]),
        updateListener
      ]
    })

    const view = new EditorView({
      state,
      parent: editorRef.current
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [])

  // Update editor content when value changes externally
  useEffect(() => {
    if (viewRef.current) {
      const currentDoc = viewRef.current.state.doc.toString()
      if (currentDoc !== value) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: value }
        })
      }
    }
  }, [value])

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: editing.current.reconfigure([
        EditorState.readOnly.of(disabled),
        EditorView.editable.of(!disabled)
      ])
    })
  }, [disabled])
  useEffect(() => {
    viewRef.current?.dispatch({ effects: appearance.current.reconfigure(isDark ? oneDark : []) })
  }, [isDark])
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: syntax.current.reconfigure(
        ['html', 'css'].includes(language)
          ? []
          : javascript({ typescript: language === 'typescript', jsx: true })
      )
    })
  }, [language])

  return (
    <div
      ref={editorRef}
      className="code-editor"
      style={{
        display: visible ? undefined : 'none',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        overflow: 'hidden',
        minHeight: '200px'
      }}
    />
  )
}
