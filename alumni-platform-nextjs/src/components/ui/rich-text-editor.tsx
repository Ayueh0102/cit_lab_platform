'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';
import { Strike } from '@tiptap/extension-strike';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import { Box, Group, Button, ActionIcon, Popover, Stack, Divider, TextInput, Text, Textarea, Modal } from '@mantine/core';
import { 
  IconBold, 
  IconItalic, 
  IconUnderline, 
  IconStrikethrough,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconAlignJustified,
  IconList,
  IconListNumbers,
  IconQuote,
  IconCode,
  IconPhoto,
  IconTable,
  IconTableOff,
  IconLink,
  IconUnlink,
  IconArrowBackUp,
  IconRotateClockwise,
  IconPalette,
  IconBrandYoutube,
  IconPhotoPlus,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { notifications } from '@mantine/notifications';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = '輸入內容...',
  editable = true,
}: RichTextEditorProps) {
  const [colorPickerOpened, setColorPickerOpened] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(content);
  const [youtubeModalOpened, setYoutubeModalOpened] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Underline,
      Strike,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        controls: true,
        nocookie: true,
        width: 640,
        height: 360,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange && !htmlMode) {
        const html = editor.getHTML();
        onChange(html);
        setHtmlContent(html);
      }
    },
    immediatelyRender: false,
  });

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const token = getToken();
      if (!token) {
        notifications.show({
          title: '請先登入',
          message: '您需要登入才能上傳圖片',
          color: 'orange',
        });
        return;
      }

      // 上傳所有選中的圖片
      for (const file of Array.from(files)) {
        try {
          const response = await api.files.upload(file, 'article_image', undefined, token);
          
          if (editor && response.url) {
            editor.chain().focus().setImage({ src: response.url }).run();
          }
        } catch (error) {
          notifications.show({
            title: '上傳失敗',
            message: `圖片 ${file.name} 上傳失敗`,
            color: 'red',
          });
        }
      }
    };
    
    input.click();
  };

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('輸入連結 URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const deleteTable = () => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
  };

  const handleYoutubeSubmit = () => {
    if (!editor || !youtubeUrl.trim()) return;
    
    // 驗證並格式化 YouTube URL
    let videoUrl = youtubeUrl.trim();
    
    // 支援多種 YouTube URL 格式
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/embed/VIDEO_ID
    
    // 提取 video ID
    let videoId = '';
    const watchMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
      videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      // 如果已經是完整的 URL，直接使用
      if (!videoUrl.startsWith('http')) {
        notifications.show({
          title: '無效的連結',
          message: '請輸入完整的 YouTube 影片連結',
          color: 'red',
        });
        return;
      }
    }
    
    editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run();
    setYoutubeUrl('');
    setYoutubeModalOpened(false);
    
    notifications.show({
      title: '影片已嵌入',
      message: 'YouTube 影片已成功插入',
      color: 'green',
    });
  };

  const handleMultipleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const token = getToken();
      if (!token) {
        notifications.show({
          title: '請先登入',
          message: '您需要登入才能上傳圖片',
          color: 'orange',
        });
        return;
      }

      // 上傳所有選中的圖片
      for (const file of Array.from(files)) {
        try {
          const response = await api.files.upload(file, 'article_gallery', undefined, token);
          
          if (editor && response.url) {
            editor.chain().focus().setImage({ src: response.url }).run();
          }
        } catch (error) {
          notifications.show({
            title: '上傳失敗',
            message: `圖片 ${file.name} 上傳失敗`,
            color: 'red',
          });
        }
      }
      
      notifications.show({
        title: '上傳完成',
        message: `已成功上傳 ${files.length} 張圖片`,
        color: 'green',
      });
    };
    
    input.click();
  };

  const toggleHtmlMode = () => {
    if (htmlMode) {
      // 從 HTML 模式切換回視覺模式
      if (editor) {
        editor.commands.setContent(htmlContent);
        if (onChange) {
          onChange(htmlContent);
        }
      }
    } else {
      // 從視覺模式切換到 HTML 模式
      if (editor) {
        setHtmlContent(editor.getHTML());
      }
    }
    setHtmlMode(!htmlMode);
  };

  // 當外部 content 改變時，同步到 htmlContent
  useEffect(() => {
    if (content !== htmlContent && !htmlMode) {
      setHtmlContent(content);
      if (editor && editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [content]);

  if (!editor) {
    return null;
  }

  return (
    <Box>
      {/* 工具欄 */}
      {editable && (
        <Box
          style={{
            border: '1px solid var(--mantine-color-gray-3)',
            borderBottom: 'none',
            borderTopLeftRadius: 'var(--mantine-radius-md)',
            borderTopRightRadius: 'var(--mantine-radius-md)',
            padding: 'var(--mantine-spacing-xs)',
            backgroundColor: 'var(--mantine-color-gray-0)',
            overflow: 'hidden',
          }}
        >
          <Stack gap="xs">
            {/* 工具欄 - 允許換行以適應不同螢幕寬度 */}
            <Group gap={4} wrap="wrap">
              {/* 格式化 */}
              <ActionIcon
                variant={editor.isActive('bold') ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().toggleBold().run()}
                size="sm"
              >
                <IconBold size={16} />
              </ActionIcon>
              <ActionIcon
                variant={editor.isActive('italic') ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                size="sm"
              >
                <IconItalic size={16} />
              </ActionIcon>
              <ActionIcon
                variant={editor.isActive('underline') ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                size="sm"
              >
                <IconUnderline size={16} />
              </ActionIcon>
              <ActionIcon
                variant={editor.isActive('strike') ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                size="sm"
              >
                <IconStrikethrough size={16} />
              </ActionIcon>

              <Divider orientation="vertical" />

              {/* 標題 */}
              <Button
                variant={editor.isActive('heading', { level: 1 }) ? 'filled' : 'subtle'}
                size="xs"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="標題 1"
                style={{ 
                  minWidth: 'auto',
                  padding: '4px 8px',
                  fontWeight: 'bold',
                  color: editor.isActive('heading', { level: 1 }) ? 'white' : 'var(--mantine-color-gray-7)'
                }}
              >
                H1
              </Button>
              <Button
                variant={editor.isActive('heading', { level: 2 }) ? 'filled' : 'subtle'}
                size="xs"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="標題 2"
                style={{ 
                  minWidth: 'auto',
                  padding: '4px 8px',
                  fontWeight: 'bold',
                  color: editor.isActive('heading', { level: 2 }) ? 'white' : 'var(--mantine-color-gray-7)'
                }}
              >
                H2
              </Button>
              <Button
                variant={editor.isActive('heading', { level: 3 }) ? 'filled' : 'subtle'}
                size="xs"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                title="標題 3"
                style={{ 
                  minWidth: 'auto',
                  padding: '4px 8px',
                  fontWeight: 'bold',
                  color: editor.isActive('heading', { level: 3 }) ? 'white' : 'var(--mantine-color-gray-7)'
                }}
              >
                H3
              </Button>

              <Divider orientation="vertical" />

              {/* 列表 */}
              <ActionIcon
                variant={editor.isActive('bulletList') ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                size="sm"
              >
                <IconList size={16} />
              </ActionIcon>
              <ActionIcon
                variant={editor.isActive('orderedList') ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                size="sm"
              >
                <IconListNumbers size={16} />
              </ActionIcon>
              <ActionIcon
                variant={editor.isActive('blockquote') ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                size="sm"
              >
                <IconQuote size={16} />
              </ActionIcon>
              <ActionIcon
                variant={editor.isActive('codeBlock') ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                size="sm"
              >
                <IconCode size={16} />
              </ActionIcon>

              <Divider orientation="vertical" />

              {/* 對齊 */}
              <ActionIcon
                variant={editor.isActive({ textAlign: 'left' }) ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                size="sm"
              >
                <IconAlignLeft size={16} />
              </ActionIcon>
              <ActionIcon
                variant={editor.isActive({ textAlign: 'center' }) ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                size="sm"
              >
                <IconAlignCenter size={16} />
              </ActionIcon>
              <ActionIcon
                variant={editor.isActive({ textAlign: 'right' }) ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                size="sm"
              >
                <IconAlignRight size={16} />
              </ActionIcon>
              <ActionIcon
                variant={editor.isActive({ textAlign: 'justify' }) ? 'filled' : 'subtle'}
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                size="sm"
              >
                <IconAlignJustified size={16} />
              </ActionIcon>

              <Divider orientation="vertical" />

              {/* 連結 */}
              <ActionIcon
                variant={editor.isActive('link') ? 'filled' : 'subtle'}
                onClick={setLink}
                size="sm"
              >
                <IconLink size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                onClick={() => editor.chain().focus().unsetLink().run()}
                disabled={!editor.isActive('link')}
                size="sm"
              >
                <IconUnlink size={16} />
              </ActionIcon>

              {/* 圖片 */}
              <ActionIcon
                variant="subtle"
                onClick={handleImageUpload}
                size="sm"
                title="上傳單張圖片"
              >
                <IconPhoto size={16} />
              </ActionIcon>
              
              {/* 多圖上傳 */}
              <ActionIcon
                variant="subtle"
                onClick={handleMultipleImageUpload}
                size="sm"
                title="上傳多張圖片（相簿）"
              >
                <IconPhotoPlus size={16} />
              </ActionIcon>

              {/* YouTube 影片 */}
              <ActionIcon
                variant="subtle"
                onClick={() => setYoutubeModalOpened(true)}
                size="sm"
                title="嵌入 YouTube 影片"
              >
                <IconBrandYoutube size={16} />
              </ActionIcon>

              {/* 表格 */}
              <ActionIcon
                variant={editor.isActive('table') ? 'filled' : 'subtle'}
                onClick={addTable}
                size="sm"
                title="插入表格"
              >
                <IconTable size={16} />
              </ActionIcon>
              {editor.isActive('table') && (
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={deleteTable}
                  size="sm"
                  title="刪除表格"
                >
                  <IconTableOff size={16} />
                </ActionIcon>
              )}

              <Divider orientation="vertical" />

              {/* 顏色 */}
              <Popover
                opened={colorPickerOpened}
                onChange={setColorPickerOpened}
                position="bottom"
                withArrow
              >
                <Popover.Target>
                  <ActionIcon
                    variant="subtle"
                    onClick={() => setColorPickerOpened((o) => !o)}
                    size="sm"
                  >
                    <IconPalette size={16} />
                  </ActionIcon>
                </Popover.Target>
                <Popover.Dropdown>
                  <Stack gap="md" p="sm" style={{ minWidth: 250 }}>
                    <Text size="sm" fw={500}>文字顏色</Text>
                    <TextInput
                      type="color"
                      label="選擇顏色"
                      size="sm"
                      defaultValue="#000000"
                      onChange={(e) => {
                        const color = e.currentTarget.value;
                        editor.chain().focus().setColor(color).run();
                      }}
                    />
                    <div>
                      <Text size="xs" c="dimmed" mb="xs">快速顏色</Text>
                      <Group gap="xs">
                        {[
                          { color: '#000000', label: '黑' },
                          { color: '#FF0000', label: '紅' },
                          { color: '#0066CC', label: '藍' },
                          { color: '#00AA00', label: '綠' },
                          { color: '#FF6600', label: '橙' },
                          { color: '#9900CC', label: '紫' },
                          { color: '#CC0000', label: '深紅' },
                          { color: '#666666', label: '灰' },
                        ].map((item) => (
                          <ActionIcon
                            key={item.color}
                            variant="filled"
                            style={{ backgroundColor: item.color }}
                            size="md"
                            onClick={() => {
                              editor.chain().focus().setColor(item.color).run();
                              setColorPickerOpened(false);
                            }}
                            title={item.label}
                          />
                        ))}
                      </Group>
                    </div>
                    <Button
                      size="xs"
                      variant="subtle"
                      fullWidth
                      onClick={() => {
                        editor.chain().focus().unsetColor().run();
                        setColorPickerOpened(false);
                      }}
                    >
                      清除顏色
                    </Button>
                  </Stack>
                </Popover.Dropdown>
              </Popover>

              <Divider orientation="vertical" />

              {/* 撤銷/重做 */}
              <ActionIcon
                variant="subtle"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                size="sm"
              >
                <IconArrowBackUp size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                size="sm"
              >
                <IconRotateClockwise size={16} />
              </ActionIcon>

              <Divider orientation="vertical" />

              {/* HTML 模式切換 */}
              <ActionIcon
                variant={htmlMode ? 'filled' : 'subtle'}
                onClick={toggleHtmlMode}
                size="sm"
                title={htmlMode ? '切換到視覺編輯' : '切換到 HTML 模式'}
              >
                <IconCode size={16} />
              </ActionIcon>
            </Group>
          </Stack>
        </Box>
      )}

      {/* 編輯區域 */}
      {htmlMode ? (
        <Box
          style={{
            border: '1px solid var(--mantine-color-gray-3)',
            borderTopLeftRadius: editable ? 0 : 'var(--mantine-radius-md)',
            borderTopRightRadius: editable ? 0 : 'var(--mantine-radius-md)',
            borderBottomLeftRadius: 'var(--mantine-radius-md)',
            borderBottomRightRadius: 'var(--mantine-radius-md)',
            backgroundColor: 'white',
          }}
        >
          <Textarea
            value={htmlContent}
            onChange={(e) => {
              const newHtml = e.currentTarget.value;
              setHtmlContent(newHtml);
              if (onChange) {
                onChange(newHtml);
              }
            }}
            placeholder="輸入 HTML 原始碼..."
            minRows={10}
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
            }}
            styles={{
              input: {
                border: 'none',
                padding: 'var(--mantine-spacing-md)',
              },
            }}
          />
        </Box>
      ) : (
        <Box
          style={{
            border: '1px solid var(--mantine-color-gray-3)',
            borderTopLeftRadius: editable ? 0 : 'var(--mantine-radius-md)',
            borderTopRightRadius: editable ? 0 : 'var(--mantine-radius-md)',
            borderBottomLeftRadius: 'var(--mantine-radius-md)',
            borderBottomRightRadius: 'var(--mantine-radius-md)',
            padding: 'var(--mantine-spacing-md)',
            minHeight: '300px',
            backgroundColor: 'white',
          }}
        >
          <EditorContent editor={editor} />
          <style jsx global>{`
          .ProseMirror {
            outline: none;
            min-height: 250px;
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            color: var(--mantine-color-gray-5);
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .ProseMirror p {
            margin: 0.5em 0;
          }
          .ProseMirror h1 {
            font-size: 2em;
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 0.5em;
          }
          .ProseMirror h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 0.5em;
          }
          .ProseMirror h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 0.5em;
          }
          .ProseMirror ul,
          .ProseMirror ol {
            padding-left: 1.5em;
            margin: 0.5em 0;
          }
          .ProseMirror blockquote {
            border-left: 3px solid var(--mantine-color-gray-4);
            padding-left: 1em;
            margin-left: 0;
            font-style: italic;
            color: var(--mantine-color-gray-7);
          }
          .ProseMirror code {
            background-color: var(--mantine-color-gray-1);
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
          }
          .ProseMirror pre {
            background-color: var(--mantine-color-gray-1);
            padding: 1em;
            border-radius: 4px;
            overflow-x: auto;
            margin: 0.5em 0;
          }
          .ProseMirror pre code {
            background-color: transparent;
            padding: 0;
          }
          .ProseMirror .editor-image {
            max-width: 100%;
            height: auto;
            border-radius: var(--mantine-radius-md);
            margin: 1em 0;
            cursor: pointer;
          }
          .ProseMirror .editor-link {
            color: var(--mantine-color-blue-6);
            text-decoration: underline;
            cursor: pointer;
          }
          .ProseMirror .editor-link:hover {
            color: var(--mantine-color-blue-7);
          }
          .ProseMirror table {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
            margin: 1em 0;
            overflow: hidden;
          }
          .ProseMirror table td,
          .ProseMirror table th {
            min-width: 1em;
            border: 1px solid var(--mantine-color-gray-3);
            padding: 8px;
            vertical-align: top;
            box-sizing: border-box;
            position: relative;
          }
          .ProseMirror table th {
            font-weight: bold;
            text-align: left;
            background-color: var(--mantine-color-gray-0);
          }
          .ProseMirror table .selectedCell:after {
            z-index: 2;
            position: absolute;
            content: "";
            left: 0; right: 0; top: 0; bottom: 0;
            background: rgba(200, 200, 255, 0.4);
            pointer-events: none;
          }
          .ProseMirror table .column-resize-handle {
            position: absolute;
            right: -2px;
            top: 0;
            bottom: -2px;
            width: 4px;
            background-color: var(--mantine-color-blue-5);
            pointer-events: none;
          }
          .ProseMirror iframe {
            max-width: 100%;
            border-radius: var(--mantine-radius-md);
            margin: 1em 0;
          }
          .ProseMirror .ProseMirror-selectednode iframe {
            outline: 2px solid var(--mantine-color-blue-5);
          }
        `}</style>
        </Box>
      )}

      {/* YouTube 影片嵌入對話框 */}
      <Modal
        opened={youtubeModalOpened}
        onClose={() => {
          setYoutubeModalOpened(false);
          setYoutubeUrl('');
        }}
        title="嵌入 YouTube 影片"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            請輸入 YouTube 影片連結（支援多種格式）
          </Text>
          <TextInput
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleYoutubeSubmit();
              }
            }}
          />
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => {
                setYoutubeModalOpened(false);
                setYoutubeUrl('');
              }}
            >
              取消
            </Button>
            <Button onClick={handleYoutubeSubmit}>
              插入影片
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
