import { StyleSheet } from "react-native";

const HtmlTagStyles = StyleSheet.create({
  
  body: {
    fontFamily: 'Quicksand-Regular',
    color: "#333",
  },
  p: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
    fontFamily: 'Quicksand-Regular',
    marginBottom: 8,
  },
  strong: {
    fontFamily: 'Quicksand-Bold',
  },
  b: {
    fontFamily: 'Quicksand-Bold',
  },
  em: {
    fontFamily: 'Quicksand-Regular', 
    fontStyle: 'italic',
  },
  i: {
    fontFamily: 'Quicksand-Regular',
    fontStyle: 'italic',
  },
  ul: {
    paddingLeft: 16,
    marginBottom: 8,
    fontFamily: 'Quicksand-Regular',
  },
  ol: {
    paddingLeft: 16,
    marginBottom: 8,
    fontFamily: 'Quicksand-Regular',
  },
  li: {
    marginBottom: 6,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Quicksand-Regular',
  },
  div: {
    fontFamily: 'Quicksand-Regular',
  },
  span: {
    fontFamily: 'Quicksand-Regular',
  },
  img: {
    width: "100%",
    height: "auto",
    borderRadius: 8,
    marginBottom: 12,
  },
});

export default HtmlTagStyles;
