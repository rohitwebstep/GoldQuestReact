import { useState } from 'react';
import {
  BtnBold,
  BtnItalic,
  Editor,
  EditorProvider,
  BtnUnderline,
  Toolbar,
  BtnBulletList,
  BtnUndo,
  BtnRedo,
  BtnNumberedList,
  createButton,
  BtnLink,
  BtnStyles
} from 'react-simple-wysiwyg';
import { SketchPicker } from 'react-color';

const ColorPickerButton = ({ color, setColor, applyColor }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setShowColorPicker(!showColorPicker)} type="button" title="Text Color">
        🖌️
      </button>
      {showColorPicker && (
        <div style={{ position: 'absolute', zIndex: 2 }}>
          <SketchPicker
            color={color}
            onChangeComplete={(newColor) => setColor(newColor.hex)}
          />
          <button onClick={applyColor} style={{ marginTop: '10px', padding: '5px', backgroundColor: '#ccc', border: 'none' }}>
            Apply Color
          </button>
        </div>
      )}
    </div>
  );
};

export default function CustomEditor() {
  const [value, setValue] = useState('simple text');
  const [color, setColor] = useState('#000000');

  const BtnAlignCenter = createButton('Align center', '≡', 'justifyCenter');
  const BtnAlignRight = createButton('Align right', '≡', 'justifyRight');
  const BtnAlignLeft = createButton('Align left', '≡', 'justifyLeft');

  function onChange(e) {
    setValue(e.target.value);
  }

  function applyColor() {
    document.execCommand('foreColor', false, color);
  }

  return (
    <EditorProvider>
      <Editor value={value} onChange={onChange} color={color} className='h-96' style={{ position: 'relative' }}>
        <Toolbar>
          <BtnBold />
          <BtnItalic />
          <BtnUnderline />
          <BtnBulletList />
          <BtnUndo />
          <BtnRedo />
          <BtnNumberedList />
          <BtnAlignLeft />
          <BtnAlignCenter />
          <BtnAlignRight />
          <BtnLink />
          <BtnStyles />
          <ColorPickerButton color={color} setColor={setColor} applyColor={applyColor} />
        </Toolbar>
      </Editor>
    </EditorProvider>
  );
}
