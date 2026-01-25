'use client';

import { useRef, useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  setCurrentTime as setCurrentTimeAction,
  setDuration as setDurationAction,
  setIsPlaying,
} from '@/store/trackSlice';
import styles from './PlayerBar.module.css';

interface PlayerBarProps {
  isLiked: boolean;
  isShuffled: boolean;
  onPlayPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onToggleShuffle: () => void;
  onToggleLike: () => void;
}

export default function PlayerBar({
  isLiked,
  isShuffled,
  onPlayPause,
  onNextTrack,
  onPrevTrack,
  onToggleShuffle,
  onToggleLike,
}: PlayerBarProps) {
  const dispatch = useAppDispatch();
  const currentTrack = useAppSelector((state) => state.track.currentTrack);
  const isPlaying = useAppSelector((state) => state.track.isPlaying);
  const playlist = useAppSelector((state) => state.track.playlist);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const lastPrevClickTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stalledRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const lastCurrentTimeRef = useRef<number>(0);
  const timeUpdateCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isManualPauseForResumeRef = useRef<boolean>(false);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const isFirstMountRef = useRef<boolean>(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      const currentSrc = audio.src || '';
      const trackUrl = currentTrack.track_file;
      if (currentSrc && (currentSrc === trackUrl || currentSrc.endsWith(trackUrl) || trackUrl.endsWith(currentSrc)) && currentSrc !== window.location.href) {
        return;
      }

      audio.pause();
      setCurrentTime(0);
      dispatch(setCurrentTimeAction(0));
      setDuration(0);
      dispatch(setDurationAction(0));

      let trackUrlToSet = currentTrack.track_file;
      if (trackUrlToSet && !trackUrlToSet.startsWith('http') && !trackUrlToSet.startsWith('//')) {
        if (!trackUrlToSet.startsWith('/')) {
          trackUrlToSet = '/' + trackUrlToSet;
        }
      }

      audio.src = trackUrlToSet;
      audio.preload = 'auto';
      lastPrevClickTime.current = 0;
      audio.load();

      if (playlist.length > 0) {
        const currentIndex = playlist.findIndex((track) => track._id === currentTrack._id);
        if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
          const nextTrack = playlist[currentIndex + 1];
          if (nextTrack && nextTrack.track_file) {
            if (!preloadAudioRef.current) {
              preloadAudioRef.current = document.createElement('audio');
              preloadAudioRef.current.style.display = 'none';
              preloadAudioRef.current.preload = 'auto';
              document.body.appendChild(preloadAudioRef.current);
            }

            let nextTrackUrl = nextTrack.track_file;
            if (nextTrackUrl && !nextTrackUrl.startsWith('http') && !nextTrackUrl.startsWith('//')) {
              if (!nextTrackUrl.startsWith('/')) {
                nextTrackUrl = '/' + nextTrackUrl;
              }
            }

            if (preloadAudioRef.current.src !== nextTrackUrl) {
              preloadAudioRef.current.src = nextTrackUrl;
              preloadAudioRef.current.load();
            }
          }
        }
      }
    } else {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setCurrentTime(0);
      dispatch(setCurrentTimeAction(0));
      setDuration(0);
      dispatch(setDurationAction(0));
      isPlayingRef.current = false;

      if (preloadAudioRef.current) {
        preloadAudioRef.current.pause();
        preloadAudioRef.current.removeAttribute('src');
        preloadAudioRef.current.load();
      }
    }

    return () => {
      if (preloadAudioRef.current) {
        preloadAudioRef.current.pause();
        preloadAudioRef.current.removeAttribute('src');
        if (preloadAudioRef.current.parentNode) {
          preloadAudioRef.current.parentNode.removeChild(preloadAudioRef.current);
        }
        preloadAudioRef.current = null;
      }
    };
  }, [currentTrack, dispatch, playlist]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) {
      isPlayingRef.current = false;
      return;
    }

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (isPlaying) {
        dispatch(setIsPlaying(false));
        isPlayingRef.current = false;
        if (!audio.paused) {
          audio.pause();
        }
        return;
      }
    }

    isPlayingRef.current = isPlaying;

    if (isPlaying) {
      if (!audio.paused && audio.readyState >= 2) {
        return;
      }

      const tryPlay = () => {
        if (!isPlayingRef.current || !currentTrack) return;

        const currentSrc = audio.src || '';
        const trackUrl = currentTrack.track_file;
        const srcMatches = currentSrc === trackUrl || currentSrc.endsWith(trackUrl) || trackUrl.endsWith(currentSrc);
        if (!srcMatches) return;

        if (audio.readyState >= 2) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                isPlayingRef.current = true;
              })
              .catch((error) => {
                isPlayingRef.current = false;
              });
          }
        }
      };

      tryPlay();

      const handleCanPlayForPlay = () => {
        tryPlay();
        audio.removeEventListener('canplay', handleCanPlayForPlay);
      };
      
      if (audio.readyState < 2) {
        audio.addEventListener('canplay', handleCanPlayForPlay);
      }
      
      return () => {
        audio.removeEventListener('canplay', handleCanPlayForPlay);
      };
    } else {
      if (!audio.paused) {
        audio.pause();
      }
      isPlayingRef.current = false;
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = isLooping;
  }, [isLooping]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      lastCurrentTimeRef.current = time;
      setCurrentTime(time);
      dispatch(setCurrentTimeAction(time));
    };

    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      if (isFinite(dur) && !isNaN(dur) && dur > 0) {
        setDuration(dur);
        dispatch(setDurationAction(dur));
      }
    };

    const handleCanPlay = () => {
      if (!currentTrack) return;

      const currentSrc = audio.src || '';
      const trackUrl = currentTrack.track_file;
      const srcMatches = currentSrc === trackUrl || currentSrc.endsWith(trackUrl) || trackUrl.endsWith(currentSrc);

      if (!srcMatches) return;

      if (isPlayingRef.current && audio.readyState >= 2 && audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              isPlayingRef.current = true;
            })
            .catch(() => {
              isPlayingRef.current = false;
            });
        }
      }
    };

    const handleError = (e: Event) => {
      const audio = e.target as HTMLAudioElement;
      if (audio.error) {
        const errorMessages = {
          1: 'Загрузка прервана',
          2: 'Ошибка сети. Проверьте подключение к интернету',
          3: 'Ошибка декодирования аудио',
          4: 'Формат аудио не поддерживается',
        };
        const errorCode = audio.error.code;
        const errorMessage = errorMessages[errorCode as keyof typeof errorMessages] || 'Неизвестная ошибка';

        dispatch(setIsPlaying(false));
        isPlayingRef.current = false;
      }
    };

    const handlePlay = () => {
      if (!audio.paused) {
        isPlayingRef.current = true;
      }
    };

    const handleWaiting = () => {
      if (isPlayingRef.current) {
        const handleCanPlayAfterWaiting = () => {
          if (isPlayingRef.current && audio.paused && !audio.ended && !audio.error && audio.readyState >= 2) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                })
                .catch((error) => {
              });
            }
          }
          audio.removeEventListener('canplay', handleCanPlayAfterWaiting);
          audio.removeEventListener('canplaythrough', handleCanPlayAfterWaiting);
        };

        audio.addEventListener('canplay', handleCanPlayAfterWaiting);
        audio.addEventListener('canplaythrough', handleCanPlayAfterWaiting);
      }
    };

    const handlePause = () => {
      if (isManualPauseForResumeRef.current) {
        isManualPauseForResumeRef.current = false;
        return;
      }

      if (isPlayingRef.current && audio.paused) {
        if (!audio.ended && !audio.error && audio.currentTime < audio.duration - 0.5) {
          setTimeout(() => {
            if (isPlayingRef.current && audio.paused && !audio.ended && !audio.error) {
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => {
                  dispatch(setIsPlaying(false));
                  isPlayingRef.current = false;
                });
              }
            }
          }, 100);
        } else {
          if (audio.ended) {
            dispatch(setIsPlaying(false));
            isPlayingRef.current = false;
          }
        }
      }
    };

    const handleEnded = () => {
      dispatch(setIsPlaying(false));
      isPlayingRef.current = false;
    };

    const handleStalled = () => {
      if (stalledRetryTimeoutRef.current) {
        clearTimeout(stalledRetryTimeoutRef.current);
      }

      if (isPlayingRef.current || isPlaying) {
        const tryResume = () => {
          if (!audio || !currentTrack) {
            return;
          }

          const currentSrc = audio.src || '';
          const trackUrl = currentTrack.track_file;
          const srcMatches = currentSrc === trackUrl || currentSrc.endsWith(trackUrl) || trackUrl.endsWith(currentSrc);
          if (!srcMatches) {
            return;
          }

          const shouldPlay = isPlayingRef.current || isPlaying;
          const isActuallyPaused = audio.paused;
          const hasNetworkIssues = audio.readyState < 3 || audio.networkState === 2;
          const shouldResume = shouldPlay && !audio.ended && !audio.error && (isActuallyPaused || hasNetworkIssues);

          if (shouldResume) {
            if (audio.readyState >= 2) {
              if (!audio.paused && hasNetworkIssues) {
                isManualPauseForResumeRef.current = true;
                audio.pause();
                const handleCanPlayAfterManualPause = () => {
                  if (isPlayingRef.current || isPlaying) {
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise
                          .then(() => {
                            isPlayingRef.current = true;
                            setTimeout(() => {
                              if (audio.paused && (isPlayingRef.current || isPlaying) && !audio.ended && !audio.error) {
                                audio.play().catch(() => {});
                              }
                            }, 300);
                          })
                          .catch(() => {
                            if (isPlayingRef.current || isPlaying) {
                            stalledRetryTimeoutRef.current = setTimeout(tryResume, 500);
                          }
                        });
                    }
                  }
                  audio.removeEventListener('canplay', handleCanPlayAfterManualPause);
                  audio.removeEventListener('canplaythrough', handleCanPlayAfterManualPause);
                };
                
                audio.addEventListener('canplay', handleCanPlayAfterManualPause);
                audio.addEventListener('canplaythrough', handleCanPlayAfterManualPause);

                const handleProgressForResume = () => {
                  if (audio.buffered.length > 0) {
                    const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
                    if (bufferedEnd > audio.currentTime + 0.5) {
                      handleCanPlayAfterManualPause();
                      audio.removeEventListener('progress', handleProgressForResume);
                    }
                  }
                };
                audio.addEventListener('progress', handleProgressForResume);
                
                if (audio.readyState >= 2) {
                  setTimeout(() => {
                    handleCanPlayAfterManualPause();
                  }, 100);
                }

                setTimeout(() => {
                  if (isPlayingRef.current || isPlaying) {
                    handleCanPlayAfterManualPause();
                  }
                  audio.removeEventListener('progress', handleProgressForResume);
                }, 2000);
              } else {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                      isPlayingRef.current = true;
                      setTimeout(() => {
                        if (audio.paused && (isPlayingRef.current || isPlaying)) {
                          audio.play().catch(() => {});
                        }
                      }, 200);
                    })
                    .catch(() => {
                      if (isPlayingRef.current || isPlaying) {
                        stalledRetryTimeoutRef.current = setTimeout(tryResume, 500);
                      }
                    });
                }
              }
            } else {
              stalledRetryTimeoutRef.current = setTimeout(tryResume, 500);
            }
          }
        };

        const handleCanPlayAfterStalled = () => {
          tryResume();
          audio.removeEventListener('canplay', handleCanPlayAfterStalled);
          audio.removeEventListener('canplaythrough', handleCanPlayAfterStalled);
        };

        audio.addEventListener('canplay', handleCanPlayAfterStalled);
        audio.addEventListener('canplaythrough', handleCanPlayAfterStalled);
        stalledRetryTimeoutRef.current = setTimeout(tryResume, 300);
      }
    };

    const handleSuspend = () => {};

    const handleAbort = () => {};

    const handleLoadStart = () => {};

    const handleCanPlayThrough = () => {};

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('suspend', handleSuspend);
    audio.addEventListener('abort', handleAbort);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('suspend', handleSuspend);
      audio.removeEventListener('abort', handleAbort);
      audio.removeEventListener('loadstart', handleLoadStart);

      if (stalledRetryTimeoutRef.current) {
        clearTimeout(stalledRetryTimeoutRef.current);
      }
    };
  }, [currentTrack, isPlaying, dispatch, onNextTrack]);

  const handleEnded = () => {
    if (!isLooping) {
      onNextTrack();
    }
  };

  const handleToggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
    dispatch(setCurrentTimeAction(newTime));
  };

  const handlePrevTrack = () => {
    if (!currentTrack) return;

    const audio = audioRef.current;
    const now = Date.now();
    const timeSinceLastClick = now - lastPrevClickTime.current;
    const REWIND_THRESHOLD = 3000;

    if (
      currentTime < 3 ||
      (timeSinceLastClick < REWIND_THRESHOLD && lastPrevClickTime.current > 0)
    ) {
      lastPrevClickTime.current = 0;
      onPrevTrack();
    } else {
      if (audio) {
        audio.currentTime = 0;
        setCurrentTime(0);
        dispatch(setCurrentTimeAction(0));
      }
      lastPrevClickTime.current = now;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastPrevClickTime.current = 0;
        timeoutRef.current = null;
      }, REWIND_THRESHOLD);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
    const roundedSeconds = Math.floor(seconds);
    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.bar}>
      <audio ref={audioRef} onEnded={handleEnded} style={{ display: 'none' }} />

      <div className={styles.content}>
        <div
          className={styles.playerProgress}
          onClick={handleProgressChange}
          style={{ cursor: currentTrack ? 'pointer' : 'default' }}
        >
          <div
            className={styles.playerProgressBar}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        <div className={styles.playerBlock}>
          <div className={styles.player}>
            <div className={styles.controls}>
              <div
                className={`${styles.btnPrev} ${styles.btn}`}
                onClick={currentTrack ? handlePrevTrack : undefined}
                style={{
                  cursor: currentTrack ? 'pointer' : 'default',
                  opacity: currentTrack ? 1 : 0.5,
                }}
              >
                <svg className={styles.btnPrevSvg}>
                  <use href="/img/icon/sprite.svg#icon-prev"></use>
                </svg>
              </div>

              <div
                className={`${styles.btnPlay} ${styles.btn} ${styles.btnIcon} ${
                  isPlaying ? styles.active : ''
                }`}
                onClick={onPlayPause}
                style={{
                  cursor: 'pointer',
                }}
              >
                <svg className={styles.btnPlaySvg}>
                  <use
                    href={`/img/icon/sprite.svg#icon-${
                      isPlaying ? 'pause' : 'play'
                    }`}
                  ></use>
                </svg>
              </div>

              <div
                className={`${styles.btnNext} ${styles.btn}`}
                onClick={currentTrack ? onNextTrack : undefined}
                style={{
                  cursor: currentTrack ? 'pointer' : 'default',
                  opacity: currentTrack ? 1 : 0.5,
                }}
              >
                <svg className={styles.btnNextSvg}>
                  <use href="/img/icon/sprite.svg#icon-next"></use>
                </svg>
              </div>

              <div
                className={`${styles.btnRepeat} ${styles.btnIcon} ${
                  styles.btn
                } ${isLooping ? styles.active : ''}`}
                onClick={handleToggleLoop}
                style={{ cursor: 'pointer' }}
              >
                <svg className={styles.btnRepeatSvg}>
                  <use href="/img/icon/sprite.svg#icon-repeat"></use>
                </svg>
              </div>

              <div
                className={`${styles.btnShuffle} ${styles.btnIcon} ${
                  styles.btn
                } ${isShuffled ? styles.active : ''}`}
                onClick={onToggleShuffle}
                style={{ cursor: 'pointer' }}
              >
                <svg className={styles.btnShuffleSvg}>
                  <use href="/img/icon/sprite.svg#icon-shuffle"></use>
                </svg>
              </div>
            </div>

            <div className={styles.trackPlay}>
              <div className={styles.contain}>
                <div className={styles.image}>
                  <svg className={styles.svg}>
                    <use href="/img/icon/sprite.svg#icon-note"></use>
                  </svg>
                </div>

                <div className={styles.author}>
                  <span className={styles.authorLink}>
                    {currentTrack?.name || 'Ты та...'}
                  </span>
                </div>

                <div className={styles.album}>
                  <span className={styles.albumLink}>
                    {currentTrack?.author || 'Баста'}
                  </span>
                </div>
              </div>

              <div className={styles.dislike}>
                <div
                  className={`${styles.btnShuffle} ${styles.btnIcon} ${styles.btn}`}
                  onClick={onToggleLike}
                  style={{ cursor: 'pointer' }}
                >
                  <svg
                    className={`${styles.likeSvg} ${
                      isLiked ? styles.likeSvgLiked : ''
                    }`}
                  >
                    <use href="/img/icon/sprite.svg#icon-like"></use>
                  </svg>
                </div>
                <div
                  className={`${styles.dislikeBtn} ${styles.btnIcon} ${styles.btn}`}
                  onClick={() => alert('Еще не реализовано')}
                  style={{ cursor: 'pointer' }}
                >
                  <svg className={styles.dislikeSvg}>
                    <use href="/img/icon/sprite.svg#icon-dislike"></use>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.volumeBlock}>
            <div className={styles.volumeContent}>
              <div className={styles.timeContainer}>
                <span className={styles.timeText}>
                  <span className={styles.timeTextPart}>
                    {formatTime(currentTime)}
                  </span>
                  <span className={styles.timeTextSeparator}>/</span>
                  <span className={styles.timeTextPart}>
                    {formatTime(duration)}
                  </span>
                </span>
              </div>

              <div className={styles.volumeImage}>
                <svg className={styles.volumeSvg}>
                  <use href="/img/icon/sprite.svg#icon-volume"></use>
                </svg>
              </div>

              <div className={`${styles.volumeProgress} ${styles.btn}`}>
                <input
                  className={`${styles.volumeProgressLine} ${styles.btn}`}
                  type="range"
                  name="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                  onChange={(e) => {
                    if (audioRef.current) {
                      audioRef.current.volume = Number(e.target.value) / 100;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
