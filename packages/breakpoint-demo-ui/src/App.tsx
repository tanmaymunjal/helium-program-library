import React, { useCallback } from "react";
import ky from "ky";
import {
  ChakraProvider,
  Container,
  Box,
  Flex,
  Text,
  theme,
} from "@chakra-ui/react";
import { Logo } from "./Logo";
import { Hotspot } from "./Hotspot";

const hotspotKeys: string[] = [
  process.env.REACT_APP_HOTSPOT_1 || "",
  process.env.REACT_APP_HOTSPOT_2 || "",
  process.env.REACT_APP_HOTSPOT_3 || "",
  process.env.REACT_APP_HOTSPOT_4 || "",
];

export const App = () => {
  const handleHotspotClick = useCallback(async (hotspot: string) => {
    console.log(hotspot);
    await ky.post(process.env.REACT_APP_ORACLE_URL || "", {
      json: { hotspotKey: hotspot },
    });
  }, []);

  return (
    <ChakraProvider
      theme={{
        ...theme,
      }}
    >
      <Container maxW="container.2xl" p="0" h="100%">
        <Flex
          w="full"
          p={4}
          gap={2}
          alignItems="center"
          justifyContent="space-between"
          bg="rgba(26,26,26,0.75)"
        >
          <Logo h={8} />
          <svg width="142.5" height="52.5" viewBox="0 0 570 210" fill="white">
            <path d="M311.69 98.68H295.82L330.67 61.3L355.77 88.21H375.23L340.41 50.86L387.83 0H382.37L358 26.09H341.32L318.52 50.55H300.68V26.09H288.45V87.23H300.68V62.78H318.52L321.14 65.59L278.21 111.7H254.52V137L202.62 192.73H208.1L270.1 126.26V161.8H284.33V139.24H311.71C317.089 139.24 322.247 137.103 326.05 133.3C329.853 129.497 331.99 124.339 331.99 118.96C331.99 113.581 329.853 108.423 326.05 104.62C322.247 100.817 317.089 98.68 311.71 98.68H311.69ZM356.64 86.21L332.73 60.57L339.73 53.07L370.63 86.21H356.64ZM284.31 112.91H311.69C313.253 112.974 314.731 113.639 315.815 114.768C316.899 115.896 317.504 117.4 317.504 118.965C317.504 120.53 316.899 122.034 315.815 123.162C314.731 124.291 313.253 124.956 311.69 125.02H284.31V112.91ZM311.69 137.24H282.31V159.82H272.08V125.39L282.31 114.46V127H311.69C313.824 126.992 315.869 126.14 317.377 124.63C318.885 123.12 319.735 121.074 319.74 118.94C319.722 116.815 318.866 114.784 317.359 113.286C315.852 111.788 313.815 110.945 311.69 110.94H285.64L295.21 100.71H311.69C316.538 100.71 321.188 102.636 324.616 106.064C328.044 109.492 329.97 114.142 329.97 118.99C329.97 123.838 328.044 128.488 324.616 131.916C321.188 135.344 316.538 137.27 311.69 137.27V137.24Z"></path>
            <path d="M389 98.6799H351.37C347.661 98.6931 344.108 100.172 341.485 102.795C338.862 105.418 337.383 108.971 337.37 112.68V147.8C337.383 151.509 338.862 155.062 341.485 157.685C344.108 160.308 347.661 161.787 351.37 161.8H389C392.713 161.8 396.274 160.325 398.9 157.699C401.525 155.074 403 151.513 403 147.8V112.69C403.001 110.851 402.64 109.029 401.937 107.329C401.234 105.63 400.203 104.085 398.903 102.784C397.603 101.483 396.059 100.451 394.36 99.7466C392.661 99.0424 390.839 98.6799 389 98.6799ZM401 147.81C401 150.993 399.736 154.045 397.485 156.295C395.235 158.546 392.183 159.81 389 159.81H351.38C348.201 159.797 345.157 158.528 342.909 156.281C340.662 154.033 339.393 150.988 339.38 147.81V112.69C339.393 109.511 340.662 106.467 342.909 104.219C345.157 101.972 348.201 100.703 351.38 100.69H389C392.183 100.69 395.235 101.954 397.485 104.205C399.736 106.455 401 109.507 401 112.69V147.81Z"></path>
            <path d="M349.59 149.59H390.78V110.91H349.59V149.59ZM351.59 112.91H388.78V147.59H351.59V112.91Z"></path>
            <path d="M411.1 161.82H425.33V98.6799H411.1V161.82ZM413.1 100.68H423.33V159.82H413.1V100.68Z"></path>
            <path d="M484.72 147.59H483.66L460.18 103.45C459.414 102.011 458.272 100.808 456.875 99.9676C455.478 99.1275 453.88 98.6825 452.25 98.6799H442.3C439.913 98.6799 437.624 99.6281 435.936 101.316C434.248 103.004 433.3 105.293 433.3 107.68V161.82H447.53V112.91H449.1L472.56 157.05C473.326 158.489 474.468 159.692 475.865 160.532C477.262 161.372 478.86 161.817 480.49 161.82H490C492.387 161.82 494.676 160.872 496.364 159.184C498.052 157.496 499 155.207 499 152.82V98.6799H484.72V147.59ZM486.72 100.68H497V152.82C497 154.676 496.262 156.457 494.95 157.77C493.637 159.082 491.857 159.82 490 159.82H480.5C479.232 159.818 477.988 159.472 476.901 158.819C475.815 158.166 474.926 157.229 474.33 156.11L450.33 110.91H445.56V159.82H435.3V107.68C435.3 105.823 436.037 104.043 437.35 102.73C438.663 101.417 440.443 100.68 442.3 100.68H452.25C453.516 100.683 454.758 101.03 455.843 101.683C456.928 102.337 457.815 103.272 458.41 104.39L482.41 149.59H486.67L486.72 100.68Z"></path>
            <path d="M506.86 98.6799V112.91H531.32V161.82H545.55V112.91H570V98.6799H506.86ZM568 110.91H543.55V159.82H533.32V110.91H508.86V100.68H568V110.91Z"></path>
            <path d="M45 26.0901H0V87.2301H45C48.5423 87.2294 52.0111 86.22 55.0007 84.3198C57.9902 82.4197 60.3768 79.7074 61.8811 76.5004C63.3855 73.2935 63.9454 69.7244 63.4954 66.2108C63.0454 62.6972 61.604 59.3844 59.34 56.6601C61.604 53.9358 63.0454 50.623 63.4954 47.1094C63.9454 43.5958 63.3855 40.0267 61.8811 36.8197C60.3768 33.6127 57.9902 30.9005 55.0007 29.0004C52.0111 27.1002 48.5423 26.0908 45 26.0901ZM12.23 38.3201H43.74C45.016 38.3168 46.2641 38.6931 47.3255 39.4013C48.3869 40.1095 49.2136 41.1175 49.7004 42.297C50.1872 43.4764 50.3121 44.7741 50.0591 46.0247C49.8062 47.2754 49.1869 48.4225 48.28 49.3201C47.9498 49.6506 47.5804 49.9394 47.18 50.1801C46.155 50.8409 44.9595 51.1884 43.74 51.1801H12.23V38.3201ZM43.74 75.0001H12.23V62.1501H43.74C45.4453 62.1501 47.0808 62.8275 48.2867 64.0334C49.4926 65.2392 50.17 66.8747 50.17 68.5801C50.17 70.2854 49.4926 71.9209 48.2867 73.1268C47.0808 74.3326 45.4453 75.0101 43.74 75.0101V75.0001Z"></path>
            <path d="M133.6 41.8601C132.777 37.4246 130.425 33.418 126.954 30.5368C123.483 27.6556 119.111 26.0822 114.6 26.0901H74V87.2301H86.27V64.6601H108.38L120.38 87.2301H134.24L121.56 63.3801C125.765 61.7645 129.271 58.7276 131.47 54.7966C133.67 50.8656 134.423 46.2887 133.6 41.8601ZM114.6 52.4301H86.27V38.3201H114.64C115.589 38.2844 116.535 38.4404 117.422 38.7789C118.309 39.1173 119.119 39.6312 119.803 40.2899C120.487 40.9485 121.031 41.7384 121.403 42.6121C121.774 43.4859 121.966 44.4256 121.966 45.3751C121.966 46.3246 121.774 47.2644 121.403 48.1381C121.031 49.0119 120.487 49.8017 119.803 50.4604C119.119 51.119 118.309 51.6329 117.422 51.9714C116.535 52.3098 115.589 52.4658 114.64 52.4301H114.6Z"></path>
            <path d="M204.03 75.0001H156.37V62.7801H204.03V50.5501H156.37V38.3201H204.03V26.0901H144.14V87.2301H204.03V75.0001Z"></path>
            <path d="M227 67.1701H266.2V87.2301H278.42V36.6001C278.42 33.8144 277.314 31.1426 275.345 29.1719C273.376 27.2012 270.706 26.0927 267.92 26.0901H225.25C222.464 26.0927 219.794 27.2012 217.825 29.1719C215.856 31.1426 214.75 33.8144 214.75 36.6001V87.2301H227V67.1701ZM227 38.3201H266.2V54.9401H227V38.3201Z"></path>
            <g>
              <path d="M439.85 192.12H433.29V187.36C433.29 186.657 433.429 185.96 433.698 185.31C433.968 184.661 434.363 184.07 434.861 183.573C435.358 183.077 435.949 182.683 436.6 182.414C437.25 182.146 437.947 182.009 438.65 182.01H451.44C452.143 182.009 452.84 182.146 453.49 182.414C454.141 182.683 454.732 183.077 455.23 183.573C455.727 184.07 456.122 184.661 456.392 185.31C456.661 185.96 456.8 186.657 456.8 187.36V191.2C456.805 192.039 456.612 192.868 456.236 193.618C455.861 194.369 455.314 195.02 454.64 195.52L443.05 204.36H457.12V210H433.29V204.92L449.76 192.48C449.919 192.368 450.046 192.217 450.13 192.042C450.214 191.867 450.252 191.674 450.24 191.48V188.8C450.24 188.489 450.119 188.189 449.903 187.965C449.686 187.741 449.391 187.61 449.08 187.6H441.08C440.762 187.6 440.457 187.726 440.232 187.952C440.006 188.177 439.88 188.482 439.88 188.8L439.85 192.12Z"></path>
              <path d="M462.13 204.64V187.36C462.13 186.657 462.269 185.96 462.538 185.31C462.808 184.661 463.203 184.07 463.701 183.573C464.198 183.077 464.789 182.683 465.44 182.414C466.09 182.146 466.787 182.009 467.49 182.01H482.36C483.063 182.009 483.76 182.146 484.41 182.414C485.061 182.683 485.652 183.077 486.149 183.573C486.647 184.07 487.042 184.661 487.312 185.31C487.581 185.96 487.72 186.657 487.72 187.36V204.64C487.72 205.344 487.581 206.041 487.312 206.691C487.043 207.342 486.648 207.932 486.15 208.43C485.652 208.928 485.061 209.323 484.411 209.592C483.761 209.861 483.064 210 482.36 210H467.49C466.786 210 466.089 209.861 465.439 209.592C464.789 209.323 464.198 208.928 463.7 208.43C463.202 207.932 462.807 207.342 462.538 206.691C462.269 206.041 462.13 205.344 462.13 204.64ZM468.69 203.16C468.69 203.478 468.816 203.784 469.041 204.009C469.267 204.234 469.572 204.36 469.89 204.36H480C480.316 204.352 480.617 204.224 480.84 204C481.064 203.777 481.192 203.476 481.2 203.16V188.84C481.192 188.524 481.064 188.223 480.84 188C480.617 187.777 480.316 187.648 480 187.64H469.89C469.572 187.64 469.267 187.766 469.041 187.991C468.816 188.217 468.69 188.522 468.69 188.84V203.16Z"></path>
              <path d="M499.29 192.12H492.73V187.36C492.73 186.657 492.869 185.96 493.138 185.31C493.408 184.661 493.803 184.07 494.3 183.573C494.798 183.077 495.389 182.683 496.04 182.414C496.69 182.146 497.387 182.009 498.09 182.01H510.88C511.583 182.009 512.28 182.146 512.93 182.414C513.581 182.683 514.172 183.077 514.669 183.573C515.167 184.07 515.562 184.661 515.832 185.31C516.101 185.96 516.24 186.657 516.24 187.36V191.2C516.245 192.039 516.052 192.868 515.676 193.618C515.301 194.369 514.754 195.02 514.08 195.52L502.49 204.36H516.56V210H492.73V204.92L509.2 192.48C509.359 192.368 509.486 192.217 509.57 192.042C509.654 191.867 509.692 191.674 509.68 191.48V188.8C509.68 188.489 509.559 188.189 509.343 187.965C509.126 187.741 508.831 187.61 508.52 187.6H500.52C500.202 187.6 499.896 187.726 499.671 187.952C499.446 188.177 499.32 188.482 499.32 188.8L499.29 192.12Z"></path>
              <path d="M527.73 192.12H521.17V187.36C521.17 186.657 521.309 185.96 521.578 185.31C521.848 184.661 522.243 184.07 522.741 183.573C523.238 183.077 523.829 182.683 524.48 182.414C525.13 182.146 525.827 182.009 526.53 182.01H539.32C540.023 182.009 540.72 182.146 541.37 182.414C542.021 182.683 542.612 183.077 543.109 183.573C543.607 184.07 544.002 184.661 544.272 185.31C544.541 185.96 544.68 186.657 544.68 187.36V191.2C544.685 192.039 544.492 192.868 544.116 193.618C543.741 194.369 543.194 195.02 542.52 195.52L530.92 204.36H545V210H521.17V204.92L537.64 192.48C537.799 192.368 537.926 192.217 538.01 192.042C538.094 191.867 538.132 191.674 538.12 191.48V188.8C538.12 188.489 537.999 188.189 537.783 187.965C537.566 187.741 537.271 187.61 536.96 187.6H528.96C528.643 187.603 528.341 187.73 528.118 187.955C527.895 188.18 527.77 188.483 527.77 188.8L527.73 192.12Z"></path>
            </g>
          </svg>
        </Flex>
        <Flex
          pt={6}
          px={50}
          w="full"
          alignItems="center"
          justifyContent="center"
        >
          <Flex justify="center" w="full">
            <Box
              py={{
                base: 2,
                md: 8,
              }}
              px={{
                base: 0,
                md: 8,
              }}
              textAlign={{
                base: "left",
                md: "center",
              }}
            >
              <Text
                as="span"
                fontSize={{
                  base: "2xl",
                  md: "3xl",
                }}
                fontWeight="extrabold"
                letterSpacing="tight"
                lineHeight="shorter"
                color="gray.100"
                mb={6}
              >
                <Text as="span" display="block">
                  Simulate Network Usage
                </Text>
                <Text as="span" display="block" color="white" opacity="0.23">
                  Select a Helium hotspot from below
                </Text>
              </Text>
            </Box>
          </Flex>
        </Flex>
        <Flex flexWrap="wrap" w="100vw" gap={4} justifyContent="center" pt={4}>
          {hotspotKeys.map((key, index) => (
            <Flex key={key} onClick={() => handleHotspotClick(key)}>
              <Hotspot>
                <Flex flexDirection="column">
                  <Text fontWeight="bold">{`Hotspot ${index + 1}`}</Text>
                </Flex>
              </Hotspot>
            </Flex>
          ))}
        </Flex>
      </Container>
    </ChakraProvider>
  );
};
