import { Avatar, List } from "antd-mobile"
import React from "react"
export const PlayPage = () => {

  return <List>
    <List.Item
      prefix={<Avatar src={demoAvatarImages[0]} />}
      description='Deserunt dolor ea eaque eos'
    >
      Novalee Spicer
    </List.Item>
  </List>
}