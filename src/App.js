import './App.css';
import { dateformate } from './utils';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';


const socket = io('https://socketmessengerserver.herokuapp.com', { autoConnect: false });

function App() {
  const [ inputText, setInputText ] = useState('');
  const [ userName, setUseraName ] = useState('');
  const [ recentlyLoggedUser, setRecentlyLoggedUser] = useState('');
  const [ isUserLoggedIn, setIsUserLoggedIn ] = useState(false);
  const [ activeUsers, setActiveUsers ] = useState([]);
  const [ selectedUser, setSelectedUser ] = useState({});
  const [ recentMessageItem, setRecentMessageItem ] = useState({});
  const [ typingUser, setTypingUser ] = useState({});



  const onUserNameInputChange = (e) => {
    setUseraName(e.target.value)
  }

  const onLogIn = () => {
    const payload = {
      userName,
      timeStamp: new Date()
    }
    socket.auth = {userName}
    socket.connect()
    setIsUserLoggedIn(true)
  }

  const onInputChange = async (e) => {
    setInputText(e.target.value)
  }

  const onUserSelect = () => {
    const updatedMessageWithUsers = activeUsers.map(user => {
      if(user.userID === recentMessageItem.from){
        user.unreadMessagesCount = 0;
      }

      return user;
    })

    setActiveUsers(updatedMessageWithUsers)
  }

  const onKeyDownEvent = async (e) => {
    if(e.key === 'Enter' && selectedUser){
      socket.emit('userTyping', { isTyping: false, to:  selectedUser.userID })

      const payload = {
        message: inputText,
        timeStamp: new Date(),
        messageRead: false
      }

      await socket.emit('message', {
        payload,
        to: selectedUser.userID
      })

      const updatedMessageWithUsers = activeUsers.map(user => {
        if(user.userID === selectedUser.userID){
          user.messages.push({payload, fromSelf: true})
        }

        return user;
      })
      setActiveUsers(updatedMessageWithUsers)
      activeUsers.forEach(user => {
        if(selectedUser && selectedUser.userID === user.userID){
          setSelectedUser(user)
        }
      })
      
      setInputText('')

    } else {
      socket.emit('userTyping', { isTyping: true, to:  selectedUser.userID })
    }
  }

  const onKeyUpEvent = () => {
    setTimeout(() => {
      socket.emit('userTyping', { isTyping: false, to:  selectedUser.userID })
    }, 1000)
  }

  useEffect(() => {

    socket.on('user connected', payload => {
      setRecentlyLoggedUser(payload.username)
      setTimeout(() =>  setRecentlyLoggedUser(''), 3000)
    })

    socket.on('getActiveUsers', payload => {
      const filteredUsers = payload.filter(user => user.userID !== socket.id)
      setActiveUsers(filteredUsers)
    })

    socket.on('userTyping', payload => {
      console.log('userTyping payload', payload)
      setTypingUser(payload)
    })

    socket.on('message', (payload) => {
      setRecentMessageItem(payload)
    })

    return () => socket.disconnect();
    
  },[])

  useEffect(() => {
      const updatedMessageWithUsers = activeUsers.map(user => {
        if(user.userID === recentMessageItem.from){
          user.messages.push(recentMessageItem)
          user.unreadMessagesCount = user.unreadMessagesCount + 1
        }

        return user;
      })

      setActiveUsers(updatedMessageWithUsers)

      activeUsers.forEach(user => {
        if(selectedUser && selectedUser.userID === user.userID){
          setSelectedUser(user)
        }
      })
  },[recentMessageItem])

  return (
    <div className="App">
      {
        isUserLoggedIn ? 
          <>
            <div className="users-list-container">
              <h4 className="username-display">Active Users</h4>
              {
                activeUsers.length ? 
                activeUsers.map(userObj => (
                  <div 
                    className={selectedUser.userID === userObj.userID ?'username-display-container active-item' : 'username-display-container'}
                    onClick={() => {setSelectedUser(userObj); onUserSelect()}}
                  >
                    <p className="username-display">
                      {userObj.username}
                      {
                        userObj.unreadMessagesCount ?
                        <span className="unread-message-count" >{userObj.unreadMessagesCount}</span> : null
                      }
                      {
                        typingUser && typingUser.from && typingUser.from === userObj.userID && typingUser.isTyping ?
                          <span className="typing-status">typing...</span> 
                          : 
                          null
                      }
                    </p>
                  </div>
                ))
                : 
                null
              }
            </div>
            {
              selectedUser.username ? 
              <div className="message-box-container">
                <div className="message-list-container">
                  <div className="massage-box-header-container">
                    <p className="massage-box-header">@{selectedUser.username}</p>
                  </div>
                  <div className="user-messages-container">
                    {
                      selectedUser && selectedUser.messages.length  ? 
                      selectedUser.messages.map(item => {
                        return (
                        <p className={item.fromSelf ? 'message user-message-item' : 'message other-message-item'}>
                          <span 
                            className={item.fromSelf ? 'user-message' : 'other-message'}
                          >{item.payload.message}</span>
                          <span className="timestamp">{`@${dateformate(item.payload.timeStamp)}`}</span>
                        </p>
                        )
                      }) : null
                    }
                    {
                      selectedUser.userID === typingUser.from && typingUser.isTyping ?
                      <p className='message other-message-item'>
                        <span className="other-message message-typing-status">typing...</span>
                      </p> : null
                    }
                  </div>
                </div>
                <div className="input-container">
                  <input type="text" className="chat-input" onKeyUp={onKeyUpEvent} onKeyDown={onKeyDownEvent} value={inputText} onChange={onInputChange} />
                </div>
              </div>
              :
              <div className="choose-message-container">
                <p className="choose-message">Choose a user you like to chat with</p>
              </div>
            }
          </>
          : 
          <>
            <p className="help-text">Validations are not yet done for this, please enter your full name to help others identify you</p>
            <div className="username-input-container">
              <input className="username-input" placeholder='User Name' value={userName} onChange={onUserNameInputChange} />
              <button onClick={onLogIn}>Log in</button>
            </div>
          </>
        }

        {
          recentlyLoggedUser  ? 
          <div className="recent-user-name-container">
            <p className="recent-user-name">{`${recentlyLoggedUser} logged in`}</p>
          </div>
          : 
          null
        }
    </div>
  );
}

export default App;
