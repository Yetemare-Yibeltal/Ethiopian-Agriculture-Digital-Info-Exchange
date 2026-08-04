// frontend/src/components/VoiceRecorder.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Mic,
  Square,
  Play,
  Pause,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  Volume2,
  MicOff
} from 'lucide-react'
import Button from './ui/Button.jsx'
import Badge from './ui/Badge.jsx'
import Card from './ui/Card.jsx' // ✅ FIXED: default import
import { formatTimeAgo } from '../utils/formatters.js'

const VoiceRecorder = ({
  variant = 'ethiopianGreen',
  language = 'am',
  onTranscriptionComplete,
  onError,
  darkMode = false,
  className = '',
  autoTranscribe = true,
  showWaveform = true,
  maxDuration = 30, // seconds
  ...props
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioURL, setAudioURL] = useState(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [error, setError] = useState(null)
  const [isMicrophoneReady, setIsMicrophoneReady] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const audioRef = useRef(null)

  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      primary: 'from-emerald-500 to-green-600',
      secondary: 'from-emerald-400 to-green-500',
      glow: 'shadow-emerald-500/20',
      pulse: 'bg-emerald-500'
    },
    ethiopianYellow: {
      primary: 'from-yellow-500 to-amber-500',
      secondary: 'from-yellow-400 to-amber-400',
      glow: 'shadow-yellow-500/20',
      pulse: 'bg-yellow-500'
    },
    ethiopianRed: {
      primary: 'from-red-600 to-rose-600',
      secondary: 'from-red-500 to-rose-500',
      glow: 'shadow-red-500/20',
      pulse: 'bg-red-600'
    },
    oromiaSunset: {
      primary: 'from-orange-500 via-pink-500 to-purple-600',
      secondary: 'from-orange-400 via-pink-400 to-purple-500',
      glow: 'shadow-orange-500/20',
      pulse: 'bg-orange-500'
    },
    amharaGold: {
      primary: 'from-amber-500 to-yellow-600',
      secondary: 'from-amber-400 to-yellow-500',
      glow: 'shadow-amber-500/20',
      pulse: 'bg-amber-500'
    },
    gondarBlue: {
      primary: 'from-blue-600 to-indigo-600',
      secondary: 'from-blue-500 to-indigo-500',
      glow: 'shadow-blue-500/20',
      pulse: 'bg-blue-600'
    },
    axumDark: {
      primary: 'from-gray-700 to-gray-900',
      secondary: 'from-gray-600 to-gray-800',
      glow: 'shadow-gray-700/20',
      pulse: 'bg-gray-700'
    },
    ethiopianFlag: {
      primary: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      secondary: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      glow: 'shadow-ethiopia-green/20',
      pulse: 'bg-ethiopia-green'
    },
    snnpPurple: {
      primary: 'from-purple-600 to-violet-600',
      secondary: 'from-purple-500 to-violet-500',
      glow: 'shadow-purple-500/20',
      pulse: 'bg-purple-600'
    },
    tigrayRuby: {
      primary: 'from-rose-600 to-red-700',
      secondary: 'from-rose-500 to-red-600',
      glow: 'shadow-rose-500/20',
      pulse: 'bg-rose-600'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // INITIALIZE MICROPHONE
  // =============================================
  const initializeMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      streamRef.current = stream
      setIsMicrophoneReady(true)
      setError(null)

      // Create audio context for waveform visualization
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      return true
    } catch (err) {
      console.error('Microphone access error:', err.message)
      setError(
        'Microphone access denied. Please allow microphone access in your browser settings.'
      )
      setIsMicrophoneReady(false)
      if (onError) onError(err.message)
      return false
    }
  }, [onError])

  // =============================================
  // START RECORDING
  // =============================================
  const startRecording = useCallback(async () => {
    if (!isMicrophoneReady) {
      const ready = await initializeMicrophone()
      if (!ready) return
    }

    try {
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm'
        })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        if (audioRef.current) {
          audioRef.current.src = url
        }

        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        // Auto-transcribe
        if (autoTranscribe && audioBlob.size > 0) {
          transcribeAudio(audioBlob)
        }
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setIsPaused(false)
      setDuration(0)
      setError(null)
      setTranscription(null)
      setExtractedData(null)

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Recording error:', err.message)
      setError('Failed to start recording: ' + err.message)
    }
  }, [isMicrophoneReady, initializeMicrophone, maxDuration, autoTranscribe])

  // =============================================
  // STOP RECORDING
  // =============================================
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    setIsPaused(false)

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // =============================================
  // PAUSE RECORDING
  // =============================================
  const togglePause = useCallback(() => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      } else if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        timerRef.current = setInterval(() => {
          setDuration(prev => {
            if (prev >= maxDuration) {
              stopRecording()
              return prev
            }
            return prev + 1
          })
        }, 1000)
      }
    }
  }, [maxDuration, stopRecording])

  // =============================================
  // TRANSCRIBE AUDIO
  // =============================================
  const transcribeAudio = useCallback(
    async audioBlob => {
      setIsTranscribing(true)
      setError(null)

      try {
        // Convert blob to base64
        const reader = new FileReader()
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
        })
        reader.readAsDataURL(audioBlob)
        const base64Audio = await base64Promise

        // Send to backend for transcription
        const response = await fetch('/api/ai/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            audio: base64Audio,
            language: language
          })
        })

        if (!response.ok) {
          throw new Error('Transcription failed')
        }

        const data = await response.json()

        if (data.success) {
          setTranscription(data.text || data.transcription)

          // Extract listing data from transcription
          if (data.extracted_data) {
            setExtractedData(data.extracted_data)
            if (onTranscriptionComplete) {
              onTranscriptionComplete({
                text: data.text || data.transcription,
                extracted_data: data.extracted_data,
                raw: data
              })
            }
          } else if (onTranscriptionComplete) {
            onTranscriptionComplete({
              text: data.text || data.transcription,
              extracted_data: null,
              raw: data
            })
          }
        } else {
          throw new Error(data.error || 'Transcription failed')
        }
      } catch (err) {
        console.error('Transcription error:', err.message)
        setError('Failed to transcribe audio: ' + err.message)
        if (onError) onError(err.message)
      } finally {
        setIsTranscribing(false)
      }
    },
    [language, onTranscriptionComplete, onError]
  )

  // =============================================
  // PLAY RECORDING
  // =============================================
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }, [isPlaying])

  // =============================================
  // CLEAR RECORDING
  // =============================================
  const clearRecording = useCallback(() => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL)
      setAudioURL(null)
    }
    setTranscription(null)
    setExtractedData(null)
    setDuration(0)
    setError(null)
    setIsPlaying(false)
    audioChunksRef.current = []
  }, [audioURL])

  // =============================================
  // FORMAT TIME
  // =============================================
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  // =============================================
  // CLEANUP ON UNMOUNT
  // =============================================
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioURL) URL.revokeObjectURL(audioURL)
    }
  }, [])

  // =============================================
  // RENDER WAVEFORM
  // =============================================
  const renderWaveform = () => {
    if (!showWaveform || !isRecording) return null

    const bars = 30
    const activeBars = Math.floor((duration / maxDuration) * bars)

    return (
      <div className='flex items-center gap-0.5 h-8 mt-2'>
        {Array.from({ length: bars }, (_, i) => {
          const isActive = i < activeBars
          const height = isActive ? 4 + Math.random() * 16 : 4
          return (
            <div
              key={i}
              className={`
                w-1 rounded-full transition-all duration-300
                ${
                  isActive
                    ? `bg-gradient-to-t ${variantConfig.primary}`
                    : 'bg-gray-300 dark:bg-gray-700'
                }
                ${isRecording && !isPaused ? 'animate-pulse' : ''}
              `}
              style={{
                height: isRecording && !isPaused ? `${height}px` : '4px',
                animationDelay: `${i * 0.05}s`
              }}
            />
          )
        })}
      </div>
    )
  }

  // =============================================
  // RENDER EXTRACTED DATA PREVIEW
  // =============================================
  const renderExtractedData = () => {
    if (!extractedData) return null

    return (
      <Card
        variant={variant}
        padding='sm'
        className='mt-3'
        darkMode={darkMode}
        animated
      >
        <div className='space-y-1.5 text-sm'>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-500 dark:text-gray-400'>
              Product:
            </span>
            <span className='font-semibold'>
              {extractedData.product_name || 'N/A'}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-500 dark:text-gray-400'>
              Quantity:
            </span>
            <span>{extractedData.quantity_quintals || 'N/A'} q</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-500 dark:text-gray-400'>
              Price:
            </span>
            <span>
              {extractedData.unit_price
                ? `Br ${extractedData.unit_price}`
                : 'N/A'}
            </span>
          </div>
          {extractedData.location && (
            <div className='flex items-center gap-2'>
              <span className='font-medium text-gray-500 dark:text-gray-400'>
                Location:
              </span>
              <span>{extractedData.location}</span>
            </div>
          )}
          {extractedData.harvest_date && (
            <div className='flex items-center gap-2'>
              <span className='font-medium text-gray-500 dark:text-gray-400'>
                Harvest Date:
              </span>
              <span>{extractedData.harvest_date}</span>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className={`w-full ${className}`} {...props}>
      {/* Status Bar */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <Badge
            variant={isMicrophoneReady ? variant : 'axumDark'}
            size='sm'
            glow={isRecording}
          >
            {isRecording
              ? '🔴 Recording'
              : isMicrophoneReady
              ? '🎤 Ready'
              : '⛔ No Mic'}
          </Badge>
          {isRecording && (
            <span className='text-sm font-mono text-gray-500 dark:text-gray-400'>
              {formatTime(duration)}
            </span>
          )}
        </div>
        {isRecording && (
          <span className='text-xs text-gray-400'>Max {maxDuration}s</span>
        )}
      </div>

      {/* Waveform */}
      {renderWaveform()}

      {/* Recording Controls */}
      <div className='flex items-center justify-center gap-3 mt-3'>
        {!isRecording && !audioURL ? (
          <Button
            variant={variant}
            size='lg'
            onClick={startRecording}
            disabled={!isMicrophoneReady && !navigator.mediaDevices}
            className='gap-2'
            animated
          >
            <Mic className='w-5 h-5' />
            Start Recording
          </Button>
        ) : isRecording ? (
          <>
            <Button
              variant='axumDark'
              size='md'
              onClick={togglePause}
              className='gap-2'
              animated
            >
              {isPaused ? (
                <>
                  <Mic className='w-4 h-4' />
                  Resume
                </>
              ) : (
                <>
                  <Pause className='w-4 h-4' />
                  Pause
                </>
              )}
            </Button>
            <Button
              variant='ethiopianRed'
              size='md'
              onClick={stopRecording}
              className='gap-2'
              animated
            >
              <Square className='w-4 h-4' />
              Stop
            </Button>
          </>
        ) : null}
      </div>

      {/* Error Message */}
      {error && (
        <div className='mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-2'>
          <AlertCircle className='w-4 h-4 text-red-500 mt-0.5 flex-shrink-0' />
          <p className='text-sm text-red-700 dark:text-red-300'>{error}</p>
        </div>
      )}

      {/* Audio Playback */}
      {audioURL && (
        <div className='mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl'>
          <audio
            ref={audioRef}
            src={audioURL}
            onEnded={() => setIsPlaying(false)}
            className='w-full'
            controls
          />
          <div className='flex items-center gap-3 mt-2'>
            <Button
              variant={variant}
              size='sm'
              onClick={togglePlay}
              className='gap-2'
              animated
            >
              {isPlaying ? (
                <Pause className='w-4 h-4' />
              ) : (
                <Play className='w-4 h-4' />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant='axumDark'
              size='sm'
              onClick={clearRecording}
              className='gap-2'
              animated
            >
              <Trash2 className='w-4 h-4' />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Transcription Status */}
      {isTranscribing && (
        <div className='mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center gap-3'>
          <Loader2 className='w-5 h-5 animate-spin text-blue-500' />
          <span className='text-sm text-blue-700 dark:text-blue-300'>
            Transcribing in Amharic...
          </span>
        </div>
      )}

      {/* Transcription Result */}
      {transcription && !isTranscribing && (
        <div className='mt-3'>
          <Card variant={variant} padding='sm' darkMode={darkMode} animated>
            <div className='flex items-start gap-2'>
              <CheckCircle className='w-4 h-4 text-green-500 mt-0.5 flex-shrink-0' />
              <div>
                <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Transcribed Text
                </p>
                <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                  {transcription}
                </p>
              </div>
            </div>
          </Card>
          {renderExtractedData()}
        </div>
      )}
    </div>
  )
}

VoiceRecorder.displayName = 'VoiceRecorder'

export default VoiceRecorder
