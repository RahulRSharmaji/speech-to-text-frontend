import { useState, useRef } from 'react'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcriptions, setTranscriptions] = useState([])
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Add transcription entry (in a real app, you'd send this to your API)
        setTranscriptions(prev => [...prev, {
          id: Date.now(),
          type: 'recording',
          audioUrl: audioUrl,
          text: 'Transcription will appear here after processing...',
          timestamp: new Date().toLocaleString()
        }])
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        setRecordingTime(0)
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      let seconds = 0
      timerRef.current = setInterval(() => {
        seconds++
        setRecordingTime(seconds)
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Error accessing microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('audio/')) {
      const audioUrl = URL.createObjectURL(file)
      
      // Add transcription entry (in a real app, you'd send this to your API)
      setTranscriptions(prev => [...prev, {
        id: Date.now(),
        type: 'upload',
        audioUrl: audioUrl,
        fileName: file.name,
        text: 'Transcription will appear here after processing...',
        timestamp: new Date().toLocaleString()
      }])
    } else {
      alert('Please select a valid audio file')
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const deleteTranscription = (id) => {
    setTranscriptions(prev => {
      const item = prev.find(t => t.id === id)
      if (item && item.audioUrl) {
        URL.revokeObjectURL(item.audioUrl)
      }
      return prev.filter(t => t.id !== id)
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Speech to Text
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Record or upload audio to convert it to text
          </p>
        </header>

        {/* Action Buttons Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* File Upload Button */}
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-md hover:shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Audio File
              </div>
            </label>

            {/* Record Audio Button */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg font-semibold transition-colors duration-200 shadow-md hover:shadow-lg animate-pulse"
              >
                <div className="w-3 h-3 bg-white rounded-full"></div>
                Stop Recording ({formatTime(recordingTime)})
              </button>
            )}
          </div>
        </div>

        {/* Transcriptions Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Transcriptions
          </h2>
          
          {transcriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <p>No transcriptions yet. Upload a file or start recording!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transcriptions.map((transcription) => (
                <div
                  key={transcription.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          transcription.type === 'recording' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {transcription.type === 'recording' ? 'Recording' : 'Upload'}
                        </span>
                        {transcription.fileName && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {transcription.fileName}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {transcription.timestamp}
                        </span>
                      </div>
                      <audio controls className="w-full mb-3" src={transcription.audioUrl} />
                    </div>
                    <button
                      onClick={() => deleteTranscription(transcription.id)}
                      className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      aria-label="Delete transcription"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {transcription.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
